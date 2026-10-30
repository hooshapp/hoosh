import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// Optional local evidence tool; serve built developer UI on 8093, outside the app.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const output = fileURLToPath(new URL('./', import.meta.url));
const report = { browser: browser.version(), cases: [], pageErrors: [], privateRequests: [] };
try {
  const page = await browser.newPage({ viewport: { width: 1100, height: 1000 } });
  page.on('pageerror', (error) => report.pageErrors.push(error.message));
  page.on('request', (request) => {
    if (/\/v1\//.test(request.url())) report.privateRequests.push(request.url());
  });
  await page.goto('http://127.0.0.1:8093/');
  await page.evaluate(() => document.fonts.ready);
  const section = page.locator('[data-testid="RN08_PROTECTION_SPECIMEN_ONLY"]');
  const preview = section.locator('[data-protection-preview]');
  const select = section.getByLabel('Simulated device state');
  const expectations = {
    'No adapter': 'Protection status unavailable',
    Unsupported: 'Protection unavailable here',
    Checking: 'Checking protection',
    'Permission revoked': 'Permission needed',
    Inactive: 'Protection inactive',
    'Installing first plan': 'Applying your plan',
    'Older installed plan': 'Plan update not confirmed',
    'Read error': 'Protection status unknown',
    Degraded: 'Protection needs attention',
    Failed: 'Protection needs attention',
    'Confirmed shield': 'Protection active',
    'Reminder only': 'Reminders active',
    'App interventions': 'App interventions active',
    'Unknown desired plan': 'Protection status unknown',
  };
  for (const [state, title] of Object.entries(expectations)) {
    await select.selectOption(state);
    await preview.getByRole('heading', { name: title, exact: true }).waitFor();
    if (state !== 'Confirmed shield')
      assert.equal(await preview.getByText('Protection active', { exact: true }).count(), 0);
    const button = preview.getByRole('button');
    if (await button.count()) {
      await button.click();
      await section
        .getByText('Preview action only. No device settings or restrictions were changed.', {
          exact: true,
        })
        .waitFor();
      assert.equal(await select.inputValue(), state);
    }
    report.cases.push({ state, title, actionDoesNotActivate: true });
  }
  await select.selectOption('No adapter');
  await preview.screenshot({ path: `${output}status-unavailable.png` });
  await select.selectOption('Confirmed shield');
  await preview.screenshot({ path: `${output}status-confirmed-example.png` });
  for (const width of [393, 320, 280]) {
    for (const dark of [false, true]) {
      await select.selectOption('Permission revoked');
      await section.getByLabel('Dark status summary').setChecked(dark);
      await preview.evaluate((element, value) => {
        element.style.width = `${value}px`;
      }, width);
      const geometry = await preview.evaluate((element) => {
        const button = element.querySelector('[role="button"]').getBoundingClientRect();
        return {
          width: element.getBoundingClientRect().width,
          height: element.getBoundingClientRect().height,
          overflow: element.scrollWidth > element.clientWidth,
          button: { width: button.width, height: button.height },
        };
      });
      assert.equal(geometry.overflow, false);
      assert(geometry.button.height >= 48);
      assert(geometry.button.width >= 44);
      report.cases.push({ width, dark, geometry });
      if (width === 320 && dark) await preview.screenshot({ path: `${output}status-320-dark.png` });
    }
  }
  await select.selectOption('Older installed plan');
  await section.getByLabel('Dark status summary').setChecked(false);
  await preview.evaluate((element) => {
    element.style.width = '320px';
    const style = document.createElement('style');
    style.textContent =
      '[data-protection-preview] [dir="auto"] {font-size:24px!important;line-height:36px!important}';
    document.head.appendChild(style);
  });
  assert.equal(
    await preview.evaluate((element) => element.scrollWidth > element.clientWidth),
    false,
  );
  await preview.screenshot({ path: `${output}status-320-large-text.png` });
  report.cases.push({ width: 320, largeText: 24, overflow: false });
  assert.deepEqual(report.pageErrors, []);
  assert.deepEqual(report.privateRequests, []);
  await writeFile(`${output}browser-results.json`, `${JSON.stringify(report, null, 2)}\n`);
  console.log(
    `Passed ${report.cases.length} protection presentation cases with no private requests.`,
  );
} finally {
  await browser.close();
}
