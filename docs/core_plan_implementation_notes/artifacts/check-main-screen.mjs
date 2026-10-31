import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// Optional evidence runner. Build developer UI, serve Vite preview on 8093.
const part = process.argv[2];
if (!['rn-09b', 'rn-09c', 'rn-09d'].includes(part))
  throw new Error('Choose rn-09b, rn-09c or rn-09d.');
const { config } = await import(`./${part}/browser-config.mjs`);
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const output = fileURLToPath(new URL(`./${part}/`, import.meta.url));
const report = {
  part,
  browser: browser.version(),
  cases: [],
  pageErrors: [],
  privateRequests: [],
  deviceAcceptance: false,
};
try {
  const page = await browser.newPage({ viewport: { width: 1100, height: 1000 } });
  page.on('pageerror', (error) => report.pageErrors.push(error.message));
  page.on('request', (request) => {
    if (/\/v1\//.test(request.url())) report.privateRequests.push(request.url());
  });
  await page.goto('http://127.0.0.1:8093/');
  await page.evaluate(() => document.fonts.ready);
  const section = page.getByTestId(config.marker);
  const capture = section.locator(config.capture);
  const phone = section.locator(config.phone);
  const select = section.getByLabel(config.select);
  for (const state of config.states) {
    await select.selectOption(state);
    await config.checkState(section, state, assert);
    report.cases.push({ state, passed: true });
  }
  await select.selectOption('Figma example');
  if (config.actions) {
    await config.actions(section, assert);
    report.cases.push({ explicitActionsOnly: true });
  }
  const digest = (value) => createHash('sha256').update(value).digest('hex');
  for (const asset of config.assets) {
    const locator = section.getByTestId(asset.id).first();
    const box = await locator.boundingBox();
    assert.equal(box.width, asset.width);
    assert.equal(box.height, asset.height);
    const img = locator.locator('img');
    await img.evaluate((el) => el.decode());
    const response = await page.request.get(
      new URL(await img.getAttribute('src'), page.url()).href,
    );
    const bytes = await readFile(
      new URL(`../../../apps/mobile/assets/${asset.file}`, import.meta.url),
    );
    assert(response.ok() && bytes.length);
    assert.equal(digest(await response.body()), digest(bytes));
    report.cases.push({
      asset: asset.file,
      width: box.width,
      height: box.height,
      originalBytes: true,
    });
  }
  await capture.screenshot({ path: `${output}figma-example.png` });
  for (const width of [393, 320, 280])
    for (const state of ['Unavailable', 'Figma example', 'Long text']) {
      await select.selectOption(state);
      await capture.evaluate((root, width) => {
        root.style.width = `${width}px`;
        root.querySelector('.phone').style.width = `${width}px`;
      }, width);
      const region = phone.getByRole('region').first();
      await region.evaluate((el) => {
        el.scrollTop = 0;
      });
      // onLayout follows the resized real component; wait for a browser layout frame.
      await page.evaluate(
        () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
      );
      const layout = await phone.evaluate((root) => {
        const box = root.getBoundingClientRect();
        return {
          width: box.width,
          overflow: root.scrollWidth > root.clientWidth,
          textOverflow: [...root.querySelectorAll('[dir="auto"]')]
            .filter(
              (el) =>
                el.tagName !== 'INPUT' &&
                (el.scrollWidth > el.clientWidth + 1 ||
                  el.getBoundingClientRect().right > box.right + 1 ||
                  el.getBoundingClientRect().left < box.left - 1),
            )
            .map((el) => el.textContent),
          buttons: [...root.querySelectorAll('[role="button"]')].map((el) => ({
            width: el.getBoundingClientRect().width,
            height: el.getBoundingClientRect().height,
          })),
        };
      });
      assert(!layout.overflow);
      assert.deepEqual(layout.textOverflow, []);
      for (const b of layout.buttons) assert(b.width >= 44 && b.height >= 44);
      report.cases.push({ width, state, layout });
      if (width === 320 && state === 'Unavailable')
        await capture.screenshot({ path: `${output}unavailable-320.png` });
    }
  await page.goto('http://127.0.0.1:8093/?width=320&largeText=1');
  await page.evaluate(() => document.fonts.ready);
  await select.selectOption('Long text');
  const large = await phone.evaluate((root) => {
    const box = root.getBoundingClientRect();
    return {
      overflow: root.scrollWidth > root.clientWidth,
      textOverflow: [...root.querySelectorAll('[dir="auto"]')]
        .filter(
          (el) =>
            el.tagName !== 'INPUT' &&
            (el.scrollWidth > el.clientWidth + 1 ||
              el.getBoundingClientRect().right > box.right + 1 ||
              el.getBoundingClientRect().left < box.left - 1),
        )
        .map((el) => el.textContent),
      scrollable: root.querySelector('[role="region"]').scrollHeight > root.clientHeight,
    };
  });
  assert(!large.overflow);
  assert.deepEqual(large.textOverflow, []);
  await capture.screenshot({ path: `${output}large-text-320.png` });
  report.cases.push({ browserTextStress: large });
  assert.deepEqual(report.pageErrors, []);
  assert.deepEqual(report.privateRequests, []);
  await writeFile(`${output}browser-results.json`, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`${part}: ${report.cases.length} browser cases passed.`);
} finally {
  await browser.close();
}
