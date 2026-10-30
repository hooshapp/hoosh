import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// Serve built isolated UI on 8093 and the real Expo static export on 8094.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const output = fileURLToPath(new URL('./', import.meta.url));
const report = {
  part: 'RN-09a Home presentation',
  browser: browser.version(),
  cases: [],
  pageErrors: [],
  privateRequests: [],
  executedOnDevice: false,
};
try {
  const page = await browser.newPage({ viewport: { width: 1100, height: 1000 } });
  page.on('pageerror', (error) => report.pageErrors.push(error.message));
  page.on('request', (request) => {
    if (/\/v1\//.test(request.url())) report.privateRequests.push(request.url());
  });
  await page.goto('http://127.0.0.1:8093/');
  await page.evaluate(() => document.fonts.ready);
  const section = page.getByTestId('RN09_HOME_SPECIMEN_ONLY');
  const capture = section.locator('[data-home-capture]');
  const phone = section.locator('[data-home-phone]');
  const scroll = section.getByTestId('home-scroll');
  const select = section.getByLabel('Home example state');
  for (const state of [
    'Unavailable',
    'Loading',
    'Read errors',
    'Empty recommendations',
    'Figma example',
    'No action handlers',
    'Busy actions',
    'Long content',
    'Mixed availability',
  ]) {
    await select.selectOption(state);
    const ready = ['Figma example', 'No action handlers', 'Busy actions', 'Long content'].includes(
      state,
    );
    assert.equal(await section.getByTestId('home-dino-artwork').count(), ready ? 1 : 0);
    if (state === 'Unavailable' || state === 'Read errors' || state === 'Loading') {
      assert.equal(await section.getByText('240', { exact: true }).count(), 0);
      assert.equal(await section.getByText('85%', { exact: true }).count(), 0);
      assert.equal(await section.getByRole('button', { name: 'Accept', exact: true }).count(), 0);
    }
    if (state === 'Empty recommendations')
      await section.getByRole('heading', { name: 'No recommendations right now' }).waitFor();
    if (state === 'Read errors')
      await section.getByRole('heading', { name: 'Couldn’t load recommendations' }).waitFor();
    if (state === 'Loading') await section.getByText('Finding recommendations…').waitFor();
    if (state === 'No action handlers')
      for (const button of await phone.getByRole('button').all()) assert(await button.isDisabled());
    if (state === 'Busy actions')
      for (const button of await phone.getByRole('button').all()) {
        if ((await button.getAttribute('aria-label')) !== 'View time saved in History')
          assert(await button.isDisabled());
      }
    report.cases.push({ state, neverFallsBackToSample: true });
  }
  await select.selectOption('Figma example');
  for (const name of [
    'Feed Dino for 10 credits',
    'Accept',
    '✕ Skip',
    'View time saved in History',
  ]) {
    await phone.getByRole('button', { name, exact: true }).click();
    await section
      .getByText(
        'Preview action only. No quest accepted, credits changed, feeding saved or apps restricted.',
        { exact: true },
      )
      .waitFor();
    assert.equal(await select.inputValue(), 'Figma example');
    await phone.getByText('240', { exact: true }).waitFor();
    await phone.getByText('Read for 20 minutes', { exact: true }).waitFor();
    report.cases.push({ action: name, noSimulatedBusinessMutation: true });
  }
  // Exact local original bytes AND the effective source slot/layer dimensions.
  const assets = [
    ['home-heart', 'icons/home/heart.svg', 12, 12],
    ['home-dino-artwork', 'mascot/home-dino-happy.svg', 110, 110],
    ['home-ellipse', 'icons/home/saved-time-ellipse.svg', 110, 110],
    ['home-accept-check', 'icons/home/check.svg', 16, 16],
    ['home-streak-dots', 'icons/home/streak-dots.svg', 86, 8],
  ];
  const digest = (value) => createHash('sha256').update(value).digest('hex');
  for (const [testID, file, width, height] of assets) {
    const element = phone.getByTestId(testID);
    const box = await element.boundingBox();
    assert.equal(box.width, width);
    assert.equal(box.height, height);
    const img = element.locator('img');
    await img.evaluate((image) => image.decode());
    const response = await page.request.get(
      new URL(await img.getAttribute('src'), page.url()).href,
    );
    assert(response.ok());
    const local = await readFile(
      new URL(`../../../../apps/mobile/assets/${file}`, import.meta.url),
    );
    assert(local.length > 0);
    assert.equal(digest(await response.body()), digest(local));
    report.cases.push({ asset: file, width, height, originalBytes: true });
  }
  const geometry = await phone.evaluate((root) => {
    const origin = root.getBoundingClientRect();
    return Object.fromEntries(
      ['home-dino-card', 'home-weekly-card', 'home-recommendation', 'home-streak'].map((id) => {
        const box = root.querySelector(`[data-testid="${id}"]`).getBoundingClientRect();
        return [
          id,
          { x: box.x - origin.x, y: box.y - origin.y, width: box.width, height: box.height },
        ];
      }),
    );
  });
  for (const [id, expected] of Object.entries({
    'home-dino-card': { x: 16, y: 8, width: 196, height: 210 },
    'home-weekly-card': { x: 228, y: 60, width: 149, height: 158 },
    'home-recommendation': { x: 16, y: 236, width: 361, height: 227 },
    'home-streak': { x: 16, y: 475, width: 361, height: 66 },
  }))
    for (const [key, value] of Object.entries(expected))
      assert(Math.abs(geometry[id][key] - value) <= 1, `${id}.${key}`);
  report.cases.push({
    baseline: 393,
    geometry,
    sourceOrigin:
      'Home 22:4 content begins 62 px above the source iPhone card origin; no fake OS status bar',
    adaptations: [
      '44 px action targets',
      'health fill follows supplied percentage',
      'measurement provenance',
    ],
  });
  await scroll.evaluate((el) => {
    el.scrollTop = 0;
  });
  await capture.screenshot({ path: `${output}home-figma-example.png` });
  for (const width of [393, 320, 280])
    for (const state of ['Unavailable', 'Figma example', 'Long content']) {
      await select.selectOption(state);
      await capture.evaluate((el, w) => {
        el.style.width = `${w}px`;
        el.querySelector('[data-home-phone]').style.width = `${w}px`;
      }, width);
      await page.waitForFunction(
        ({ width }) =>
          document
            .querySelector('[data-testid="RN09_HOME_SPECIMEN_ONLY"] [data-testid="home-content"]')
            .getBoundingClientRect().width ===
          width - 32,
        { width },
      );
      const layout = await phone.evaluate((root) => ({
        overflow: root.scrollWidth > root.clientWidth,
        textOverflow: [...root.querySelectorAll('[dir="auto"]')]
          .filter(
            (el) =>
              el.scrollWidth > el.clientWidth + 1 ||
              el.getBoundingClientRect().right > root.getBoundingClientRect().right + 0.5 ||
              el.getBoundingClientRect().left < root.getBoundingClientRect().left - 0.5,
          )
          .map((el) => el.textContent),
        buttons: [...root.querySelectorAll('[role="button"]')].map((el) => ({
          name: el.getAttribute('aria-label'),
          width: el.getBoundingClientRect().width,
          height: el.getBoundingClientRect().height,
        })),
      }));
      assert.equal(layout.overflow, false);
      assert.deepEqual(layout.textOverflow, []);
      for (const button of layout.buttons) {
        assert(button.width >= 44);
        assert(button.height >= 44);
      }
      report.cases.push({ width, state, layout });
      if (width === 320 && state === 'Unavailable')
        await capture.screenshot({ path: `${output}home-320-unavailable.png` });
    }
  await page.goto('http://127.0.0.1:8093/?width=320&largeText=1');
  await page.evaluate(() => document.fonts.ready);
  await section.getByLabel('Home example state').selectOption('Long content');
  const large = await phone.evaluate((root) => ({
    overflow: root.scrollWidth > root.clientWidth,
    textOverflow: [...root.querySelectorAll('[dir="auto"]')]
      .filter(
        (el) =>
          el.scrollWidth > el.clientWidth + 1 ||
          el.getBoundingClientRect().right > root.getBoundingClientRect().right + 0.5 ||
          el.getBoundingClientRect().left < root.getBoundingClientRect().left - 0.5,
      )
      .map((el) => el.textContent),
    scrollable: root.querySelector('[data-testid="home-scroll"]').scrollHeight > root.clientHeight,
  }));
  assert.equal(large.overflow, false);
  assert.deepEqual(large.textOverflow, []);
  assert(large.scrollable);
  const largeHeading = await phone
    .getByRole('heading', { name: 'Recommended for you', exact: true })
    .boundingBox();
  assert(
    largeHeading.width >= 240 && largeHeading.width <= 257,
    'Compact recommendation heading must use the available line, not a narrow badge column',
  );
  await capture.screenshot({ path: `${output}home-320-large-text.png` });
  report.cases.push({ width: 320, fontSize: 24, browserTextStress: large });
  // The actual app route: genuine Router/nav composition, all Home values unavailable.
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto('http://127.0.0.1:8094/');
  await page.getByTestId('home-scroll').waitFor();
  await page.evaluate(() => document.fonts.ready);
  assert(await page.getByRole('button', { name: 'Feed Dino', exact: true }).isDisabled());
  assert.equal(await page.getByTestId('home-dino-artwork').count(), 0);
  assert.equal(await page.getByText('240', { exact: true }).count(), 0);
  await page.getByRole('heading', { name: 'Protection unavailable', exact: true }).waitFor();
  for (const tab of ['Quests', 'History', 'Settings', 'Home']) {
    await page.getByRole('tab', { name: tab, exact: true }).click();
    await page.getByRole('tab', { name: tab, exact: true, selected: true }).waitFor();
  }
  const clearance = await page.getByTestId('home-scroll').evaluate((el) => {
    el.scrollTop = el.scrollHeight;
    const content = el.firstElementChild;
    const nav = document.querySelector('[data-testid="main-tab-bar"]').getBoundingClientRect();
    const last = el
      .querySelector('[data-testid="home-content"]')
      .lastElementChild.getBoundingClientRect();
    return {
      lastBottom: last.bottom,
      navTop: nav.top,
      paddingBottom: getComputedStyle(content).paddingBottom,
    };
  });
  assert(
    clearance.lastBottom < clearance.navTop,
    'Last Home card must scroll clear of the real floating nav',
  );
  await page.getByTestId('home-scroll').evaluate((el) => {
    el.scrollTop = 0;
  });
  await page.screenshot({ path: `${output}home-real-app.png` });
  report.cases.push({ realApp: true, fourTabsNavigate: true, noExampleData: true, clearance });
  assert.deepEqual(report.pageErrors, []);
  assert.deepEqual(report.privateRequests, []);
  await writeFile(`${output}browser-results.json`, `${JSON.stringify(report, null, 2)}\n`);
  console.log(
    `RN-09a passed ${report.cases.length} browser cases; no page errors or private requests.`,
  );
} finally {
  await browser.close();
}
