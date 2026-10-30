import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// Optional evidence runner; serve the built isolated UI on 8093. No app dependency.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const output = fileURLToPath(new URL('./', import.meta.url));
const report = { browser: browser.version(), cases: [], pageErrors: [], privateRequests: [] };
try {
  const page = await browser.newPage({ viewport: { width: 1000, height: 1000 } });
  page.on('pageerror', (error) => report.pageErrors.push(error.message));
  page.on('request', (request) => {
    if (/\/v1\//.test(request.url())) report.privateRequests.push(request.url());
  });
  await page.goto('http://127.0.0.1:8093/');
  await page.evaluate(() => document.fonts.ready);
  const section = page.locator('[data-testid="RN07_PROFILE_SPECIMEN_ONLY"]');
  const preview = section.locator('[data-profile-preview]');
  const field = section.getByRole('textbox', { name: 'Display name', exact: true });
  const save = section.getByRole('button', { name: 'Save changes', exact: true });
  assert.equal(await field.inputValue(), 'Jordan Rivera');
  assert(await save.isDisabled());
  await preview.locator('img').evaluate((image) => image.decode());
  await preview.screenshot({ path: `${output}profile-393-initial.png` });
  report.cases.push(
    'Initial Figma sample is explicitly labeled, unchanged Save disabled, avatar decoded.',
  );
  for (const width of [393, 320, 280]) {
    await preview.evaluate((element, value) => {
      element.style.width = `${value}px`;
    }, width);
    const geometry = await preview.evaluate((element) => {
      const image = element.querySelector('img').getBoundingClientRect();
      const save = [...element.querySelectorAll('[role="button"]')]
        .find((button) => button.textContent === 'Save changes')
        .getBoundingClientRect();
      return {
        width: element.getBoundingClientRect().width,
        height: element.getBoundingClientRect().height,
        overflow: element.scrollWidth > element.clientWidth,
        image: [image.width, image.height],
        saveHeight: save.height,
      };
    });
    assert.equal(geometry.overflow, false);
    assert.deepEqual(geometry.image, [52, 52]);
    assert(geometry.saveHeight >= 52);
    report.cases.push({ width, geometry });
  }
  await field.fill('  A\u030A new name  ');
  assert(await save.isEnabled());
  await section.getByRole('button', { name: 'Discard changes', exact: true }).click();
  assert.equal(await field.inputValue(), 'Jordan Rivera');
  report.cases.push('Discard restores only the local preview baseline.');
  await field.fill('Ada Lovelace');
  await save.click();
  await section
    .getByText('Preview updated locally. Nothing was saved to an account.', { exact: true })
    .waitFor();
  assert(await save.isDisabled());
  assert.equal(
    await preview.getByRole('heading', { name: 'Ada Lovelace', exact: true }).count(),
    1,
  );
  await page.reload();
  await page.evaluate(() => document.fonts.ready);
  assert.equal(await field.inputValue(), 'Jordan Rivera');
  report.cases.push('Apply updates only local preview; reload resets the Figma sample.');
  await section.getByRole('button', { name: 'Remove display name', exact: true }).click();
  await section.getByRole('button', { name: 'Keep name', exact: true }).click();
  assert.equal(await field.inputValue(), 'Jordan Rivera');
  await section.getByRole('button', { name: 'Remove display name', exact: true }).click();
  await section.getByRole('button', { name: 'Remove name', exact: true }).click();
  assert.equal(await field.inputValue(), '');
  await section
    .getByText('Your display name will be removed when you save.', { exact: true })
    .waitFor();
  report.cases.push('Remove requires explicit confirmation and stages clear without applying.');
  await section.getByRole('button', { name: 'Reset profile example', exact: true }).click();
  await field.fill('Unsaved draft');
  for (const [control, action] of [
    ['Simulate conflict', 'Review latest profile'],
    ['Simulate unconfirmed save', 'Check latest profile'],
  ]) {
    await section.getByRole('button', { name: control, exact: true }).click();
    assert(await save.isDisabled());
    await field.fill('Draft retained during review');
    assert(await save.isDisabled());
    await section.getByRole('button', { name: action, exact: true }).click();
    assert.equal(await field.inputValue(), 'Draft retained during review');
    report.cases.push(`${control}: Save blocked until explicit preview review; draft retained.`);
  }
  await section.getByRole('button', { name: 'Simulate saving', exact: true }).click();
  assert(await field.isDisabled());
  assert(await section.getByRole('button', { name: 'Saving…', exact: true }).isDisabled());
  report.cases.push('Saving locks input/save/discard.');
  await section.getByRole('button', { name: 'Reset profile example', exact: true }).click();
  await field.fill('Unsaved');
  await section.getByRole('button', { name: 'Simulate validation error', exact: true }).click();
  await section
    .getByText('Enter a display name, or choose Remove display name.', { exact: true })
    .waitFor();
  await preview.screenshot({ path: `${output}profile-validation.png` });
  report.cases.push('Validation presentation retains unsaved input and associates the error.');
  await section.getByRole('button', { name: 'Reset profile example', exact: true }).click();
  await preview.evaluate((element) => {
    element.style.width = '320px';
    const style = document.createElement('style');
    style.textContent =
      '[data-profile-preview] [dir="auto"], [data-profile-preview] input { font-size:24px!important;line-height:36px!important }';
    document.head.appendChild(style);
  });
  assert.equal(
    await preview.evaluate((element) => element.scrollWidth > element.clientWidth),
    false,
  );
  await preview.screenshot({ path: `${output}profile-320-large-text.png` });
  report.cases.push(
    '320px with 24px text reflows without horizontal component overflow (browser stress only).',
  );
  assert.deepEqual(report.pageErrors, []);
  assert.deepEqual(report.privateRequests, []);
  await writeFile(`${output}browser-results.json`, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Passed ${report.cases.length} profile UI cases with no private API requests.`);
} finally {
  await browser.close();
}
