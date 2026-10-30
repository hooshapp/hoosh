import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// Optional local evidence tool, not an app dependency. Serve built UI preview on 8093.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const output = fileURLToPath(new URL('./', import.meta.url));
const report = { browser: browser.version(), cases: [], pageErrors: [], expectedImageFailures: 0 };
try {
  const page = await browser.newPage({ viewport: { width: 900, height: 900 } });
  page.on('pageerror', (error) => report.pageErrors.push(error.message));
  for (const width of [393, 320, 280]) {
    await page.goto(`http://127.0.0.1:8093/?width=${width === 393 ? '393' : '320'}`);
    await page.evaluate(() => document.fonts.ready);
    for (const variant of ['email', 'null-email', 'long-email']) {
      const card = page.locator(`[data-account-case="${variant}"]`);
      await card.evaluate((element, target) => {
        element.style.width = `${target}px`;
      }, width);
      await card.locator('img').evaluate((image) => image.decode());
      const geometry = await card.evaluate((element) => {
        const image = element.querySelector('img');
        const parents = [];
        for (let node = image; node; node = node.parentElement) parents.push(node);
        const avatar = parents.find((node) => getComputedStyle(node).borderTopWidth === '2px');
        const rect = (node) => {
          const r = node.getBoundingClientRect();
          return { width: r.width, height: r.height, x: r.x, y: r.y };
        };
        return {
          card: rect(element),
          image: rect(image),
          avatar: rect(avatar),
          intrinsic: [image.naturalWidth, image.naturalHeight],
          overflow: element.scrollWidth > element.clientWidth,
          title: element.querySelector('[role="heading"]').textContent,
          imageUrl: new URL(image.currentSrc).pathname,
        };
      });
      assert.equal(geometry.title, 'Your account');
      assert.deepEqual(geometry.intrinsic, [52, 52]);
      assert.equal(geometry.image.width, 52);
      assert.equal(geometry.image.height, 52);
      assert.equal(geometry.avatar.width, 64);
      assert.equal(geometry.avatar.height, 64);
      assert.equal(geometry.overflow, false);
      assert.equal(geometry.avatar.x - geometry.card.x, 20);
      const email =
        variant === 'email'
          ? 'fixture@example.test'
          : variant === 'null-email'
            ? 'Signed-in account'
            : 'long-address-';
      assert((await card.innerText()).includes(email));
      report.cases.push({ width, variant, ...geometry });
      if (
        (width === 393 && variant !== 'long-email') ||
        (width === 280 && variant === 'long-email')
      )
        await card.screenshot({ path: `${output}account-${width}-${variant}.png` });
    }
  }
  await page.route('**/*settings-avatar*.svg', (route) => {
    report.expectedImageFailures++;
    return route.abort();
  });
  await page.goto('http://127.0.0.1:8093/');
  const failed = page.locator('[data-account-case="email"]');
  await failed.getByText('fixture@example.test', { exact: true }).waitFor();
  await page.waitForFunction(
    () => document.querySelectorAll('[data-account-case] img').length === 0,
  );
  assert.equal(await failed.locator('img').count(), 0);
  await failed.screenshot({ path: `${output}account-image-failure.png` });
  report.cases.push({
    variant: 'image-failure',
    readableIdentity: true,
    replacementArtwork: false,
  });
  assert(report.expectedImageFailures > 0);
  assert.deepEqual(report.pageErrors, []);
  const development = await browser.newPage();
  const developmentErrors = [];
  development.on('pageerror', (error) => developmentErrors.push(error.message));
  await development.goto('http://127.0.0.1:8094/');
  await development.getByText('Account region — synthetic presentation only').waitFor();
  await development.locator('[data-account-case="email"] img').evaluate((image) => image.decode());
  assert.equal(await development.locator('[data-account-case]').count(), 3);
  assert.deepEqual(developmentErrors, []);
  report.development = { accountCards: 3, originalAvatarDecoded: true, pageErrors: developmentErrors };
  await development.close();
  await writeFile(`${output}browser-results.json`, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Passed ${report.cases.length} account visual/asset cases.`);
} finally {
  await browser.close();
}
