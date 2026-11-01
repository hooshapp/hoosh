import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const report = { cases: [], errors: [], privateRequests: [], physicalDevice: false };
try {
  const page = await browser.newPage({ viewport: { width: 393, height: 480 } });
  page.on('pageerror', (error) => report.errors.push(error.message));
  page.on('request', (request) => {
    if (/\/v1\//.test(request.url())) report.privateRequests.push(request.url());
  });
  await page.goto('http://127.0.0.1:8093');
  await page.evaluate(() => document.fonts.ready);
  const quest = page.getByTestId('RN09E_EDITOR_ONLY');
  for (const width of [393, 320, 280])
    for (const large of [false, true]) {
      await page.setViewportSize({ width, height: 480 });
      await quest.getByRole('button', { name: 'Back', exact: true }).click();
      const modal = page.getByTestId('editor-confirmation');
      await modal.waitFor();
      if (large)
        await modal.locator('[dir="auto"]').evaluateAll((elements) =>
          elements.forEach((el) => {
            el.style.fontSize = '24px';
            el.style.lineHeight = '36px';
          }),
        );
      const keep = modal.getByRole('button', { name: 'Keep editing', exact: true });
      const discard = modal.getByRole('button', { name: 'Discard and leave', exact: true });
      assert(await keep.evaluate((el) => el === document.activeElement));
      for (const button of [keep, discard]) {
        await button.scrollIntoViewIfNeeded();
        const box = await button.boundingBox();
        assert(
          box &&
            box.x >= 0 &&
            box.x + box.width <= width + 1 &&
            box.width >= 44 &&
            box.height >= 44 &&
            box.y >= 0 &&
            box.y + box.height <= 481,
        );
      }
      assert(!(await modal.evaluate((el) => el.scrollWidth > el.clientWidth)));
      if (width === 393 || width === 280)
        await page.screenshot({
          path: new URL(`./confirmation-${width}${large ? '-large' : ''}.png`, import.meta.url)
            .pathname,
        });
      await keep.click();
      await modal.waitFor({ state: 'detached' });
      assert(
        await quest
          .getByRole('button', { name: 'Back', exact: true })
          .evaluate((el) => el === document.activeElement),
      );
      report.cases.push({
        width,
        height: 480,
        largeBrowserText: large,
        safeFocusAndReturn: true,
        reachableActions: true,
      });
    }
  await quest.getByRole('button', { name: 'Back', exact: true }).click();
  await page.keyboard.press('Escape');
  await page.getByTestId('editor-confirmation').waitFor({ state: 'detached' });
  report.cases.push({ browserEscapeKeepsDraft: true });
  assert.deepEqual(report.errors, []);
  assert.deepEqual(report.privateRequests, []);
  await writeFile(
    new URL('./confirmation-results.json', import.meta.url),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  console.log(`${report.cases.length} browser confirmation checks passed; no native-device claim.`);
} finally {
  await browser.close();
}
