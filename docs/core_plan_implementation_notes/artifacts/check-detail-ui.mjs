import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
const definitions = {
  'rn-09e': ['RN09E_EDITOR_ONLY', 'Quest editor state', ['Personalize', 'Custom', 'Blank', 'Edit', 'Saving', 'Save error', 'Conflict', 'Unconfirmed', 'Unavailable', 'Long text']],
  'rn-09f': ['RN09F_PREFERENCES_ONLY', 'Preference page', ['Activities', 'Age', 'Apps', 'Native unavailable', 'Gender', 'Long text']],
  'rn-09g': ['RN09G_PLAN_ONLY', 'Plan editor page', ['Days', 'Hours', 'Sessions', 'Saving', 'Save error', 'Unavailable', 'Long text']],
  'rn-09h': ['RN09H_HISTORY_ONLY', 'History detail page', ['Progress', 'Reduction', 'Unavailable', 'Loading', 'Read error', 'Ineligible', 'Zero baseline', 'Long text']],
};
const part = process.argv[2]; if (!definitions[part]) throw new Error('Select rn-09e/f/g/h');
const [marker, label, states] = definitions[part], root = new URL('../../../apps/mobile/assets/', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('manifest.json', root), 'utf8'));
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const output = new URL(`./${part}/`, import.meta.url); await mkdir(output, { recursive: true });
const report = { part, cases: [], assets: [], errors: [], privateRequests: [], nativeDeviceAcceptance: false };
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1050, height: 1000 } });
  page.on('pageerror', (e) => report.errors.push(e.message));
  page.on('request', (r) => { if (/\/v1\//.test(r.url())) report.privateRequests.push(r.url()); });
  await page.goto('http://127.0.0.1:8093'); await page.evaluate(() => document.fonts.ready);
  const section = page.getByTestId(marker), phone = section.locator('.phone'), select = section.getByLabel(label);
  await section.scrollIntoViewIfNeeded();
  for (const state of states) {
    await select.selectOption(state);
    for (const img of await phone.locator('img').all()) {
      await img.evaluate(async (el) => { el.loading = 'eager'; await Promise.race([el.decode(), new Promise((_, reject) => setTimeout(() => reject(new Error('Image decode timed out: ' + el.src)), 5000))]); }); const url = new URL(await img.getAttribute('src'), page.url());
      const response = await page.request.get(url.href), bytes = await response.body();
      const asset = manifest.assets.find((a) => a.sha256 === digest(bytes)); assert(asset, `Unknown/nonoriginal asset ${url}`);
      const box = await img.boundingBox(); assert.equal(box.width, Number(asset.width)); assert.equal(box.height, Number(asset.height));
      assert.equal(digest(await readFile(new URL(asset.file, root))), asset.sha256);
      if (!report.assets.some((a) => a.file === asset.file)) report.assets.push({ file: asset.file, width: box.width, height: box.height, originalBytes: true });
    }
    await phone.screenshot({ path: new URL(`${state.toLowerCase().replaceAll(' ', '-')}.png`, output).pathname });
    report.cases.push({ state, rendered: true });
  }
  for (const width of [393, 320, 280]) for (const state of [states[0], 'Long text']) {
    await select.selectOption(state); await phone.evaluate((el, width) => el.style.width = `${width}px`, width);
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const layout = await phone.evaluate((el) => ({ overflow: el.scrollWidth > el.clientWidth, targets: [...el.querySelectorAll('[role="button"],[role="checkbox"],[role="radio"]')].map((b) => ({ width: b.getBoundingClientRect().width, height: b.getBoundingClientRect().height })) }));
    assert(!layout.overflow); for (const target of layout.targets) assert(target.width >= 44 && target.height >= 44, JSON.stringify(target));
    report.cases.push({ width, state, layout });
  }
  await page.goto('http://127.0.0.1:8093/?width=320&largeText=1'); await select.selectOption('Long text');
  const overflow = await phone.evaluate((el) => el.scrollWidth > el.clientWidth); assert(!overflow);
  await phone.screenshot({ path: new URL('large-text-320.png', output).pathname }); report.cases.push({ largeText320: true });
  assert.deepEqual(report.errors, []); assert.deepEqual(report.privateRequests, []);
  await writeFile(new URL('browser-results.json', output), JSON.stringify(report, null, 2) + '\n');
  console.log(`${part}: ${report.cases.length} cases, ${report.assets.length} original assets passed.`);
} finally { await browser.close(); }
