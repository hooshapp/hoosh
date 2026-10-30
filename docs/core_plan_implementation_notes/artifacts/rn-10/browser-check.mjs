import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// Built developer UI: 8093. Real Expo static export: 8094. No real account/device.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const output = fileURLToPath(new URL('./', import.meta.url));
const report = {
  part: 'RN-10 shared UI hardening',
  browser: browser.version(),
  cases: [],
  pageErrors: [],
  privateRequests: [],
  nativeAssistiveTechnologyTested: false,
};
try {
  const page = await browser.newPage({ viewport: { width: 393, height: 852 } });
  page.on('pageerror', (error) => report.pageErrors.push(error.message));
  page.on('request', (request) => {
    if (/\/v1\//.test(request.url())) report.privateRequests.push(request.url());
  });
  await page.goto('http://127.0.0.1:8094/');
  const tab = (name) => page.getByRole('tab', { name, exact: true });
  await tab('Home').waitFor();
  await tab('Home').focus();
  await page.keyboard.press('ArrowRight');
  assert((await tab('Home').getAttribute('aria-selected')) === 'true');
  assert(await tab('Quests').evaluate((el) => el === document.activeElement));
  await page.keyboard.press('Space');
  await page.getByRole('tab', { name: 'Quests', exact: true, selected: true }).waitFor();
  await page.keyboard.press('End');
  await page.keyboard.press('Enter');
  await page.getByRole('tab', { name: 'Settings', exact: true, selected: true }).waitFor();
  await page.getByRole('heading', { name: 'Settings', exact: true }).waitFor();
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement.getAttribute('role')), 'tabpanel');
  await page.keyboard.press('Tab');
  assert(
    await page
      .getByRole('link', { name: 'View sign-in screen' })
      .evaluate((el) => el === document.activeElement),
  );
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Shift+Tab');
  assert(await tab('Settings').evaluate((el) => el === document.activeElement));
  report.cases.push({
    keyboard: 'manual tab activation, forward into panel/link, backward to tab',
    passed: true,
  });
  const cdp = await page.context().newCDPSession(page);
  const tree = await cdp.send('Accessibility.getFullAXTree');
  const tabs = tree.nodes.filter((node) => !node.ignored && node.role?.value === 'tab');
  assert.equal(tabs.length, 4);
  assert.equal(
    tabs.filter((node) =>
      node.properties?.some((prop) => prop.name === 'selected' && prop.value.value === true),
    ).length,
    1,
  );
  report.cases.push({
    browserAccessibilityTree: true,
    namedTabs: tabs.map((node) => node.name.value),
    oneSelectedTab: true,
  });
  for (const width of [280, 320, 393, 430])
    for (const large of [false, true]) {
      await page.setViewportSize({ width, height: width === 320 ? 568 : 852 });
      const style = large
        ? await page.addStyleTag({
            content: '[dir="auto"]{font-size:24px!important;line-height:36px!important}',
          })
        : null;
      for (const name of ['Home', 'Quests', 'History', 'Settings']) {
        await tab(name).click();
        await page.getByRole('tab', { name, exact: true, selected: true }).waitFor();
        const title = {
          Home: 'Dino health',
          Quests: 'Your Quests',
          History: 'Your progress',
          Settings: 'Settings',
        }[name];
        await page.getByRole('heading', { name: title, exact: true }).waitFor();
        const panel = page.getByRole('tabpanel', { name, exact: true });
        const scroll = panel.getByRole('region').first();
        await scroll.evaluate((el) => {
          el.scrollTop = el.scrollHeight;
        });
        await page.waitForFunction(() => {
          const nav = document.querySelector('[data-testid="main-tab-bar"]');
          const region = document.querySelector('[role="tabpanel"] [role="region"]');
          return (
            nav &&
            region &&
            parseFloat(getComputedStyle(region.firstElementChild).paddingBottom) >=
              nav.getBoundingClientRect().height + 28
          );
        });
        const layout = await panel.evaluate((el) => {
          const nav = document.querySelector('[data-testid="main-tab-bar"]');
          const bar = nav.getBoundingClientRect();
          const scroll = el.querySelector('[role="region"]');
          const content = scroll.firstElementChild;
          const last = content.lastElementChild.getBoundingClientRect();
          return {
            overflow: el.scrollWidth > el.clientWidth,
            barOverflow: nav.scrollWidth > nav.clientWidth + 1,
            barHeight: bar.height,
            paddingBottom: parseFloat(getComputedStyle(content).paddingBottom),
            lastBottom: last.bottom,
            navTop: bar.top,
            targets: [...nav.querySelectorAll('[role="tab"]')].map((node) => {
              const r = node.getBoundingClientRect();
              return {
                name: node.getAttribute('aria-label'),
                width: r.width,
                height: r.height,
                insideBar: r.left >= bar.left && r.right <= bar.right + 1,
              };
            }),
          };
        });
        assert(!layout.overflow && !layout.barOverflow);
        assert(
          layout.lastBottom < layout.navTop,
          `${width}/${large}/${name}: content obscured by footer`,
        );
        for (const target of layout.targets) {
          assert(target.width >= 44 && target.height >= 44 && target.insideBar);
        }
        report.cases.push({ width, textSize: large ? 24 : 'default', tab: name, layout });
        if (width === 320 && large && name === 'Settings')
          await page.screenshot({ path: `${output}navigation-320-large-text.png` });
      }
      if (style) await style.evaluate((el) => el.remove());
    }
  await page.setViewportSize({ width: 1100, height: 1000 });
  await page.goto('http://127.0.0.1:8093/?width=320');
  await page.evaluate(() => document.fonts.ready);
  const profile = page.getByTestId('RN07_PROFILE_SPECIMEN_ONLY');
  const input = profile.getByLabel('Display name', { exact: true });
  await input.fill('Unsaved preview name');
  await profile.getByRole('button', { name: 'Remove display name', exact: true }).click();
  assert(
    await profile
      .getByRole('button', { name: 'Keep name', exact: true })
      .evaluate((el) => el === document.activeElement),
  );
  await profile.getByRole('button', { name: 'Keep name', exact: true }).click();
  assert(
    await profile
      .getByRole('button', { name: 'Remove display name', exact: true })
      .evaluate((el) => el === document.activeElement),
  );
  await profile.getByRole('button', { name: 'Remove display name', exact: true }).click();
  await profile.getByRole('button', { name: 'Remove name', exact: true }).click();
  assert(await input.evaluate((el) => el === document.activeElement));
  assert.equal(await input.inputValue(), '');
  report.cases.push({
    profileConfirmation: 'safe initial focus, cancel return, explicit clear focuses field',
    noAccountWrite: true,
  });
  await input.fill('Retained draft');
  await input.focus();
  await profile.getByRole('button', { name: 'Simulate validation error', exact: true }).click();
  assert.equal(await input.getAttribute('aria-invalid'), 'true');
  const descriptions = await input.evaluate((el) =>
    el
      .getAttribute('aria-describedby')
      .split(' ')
      .map((id) => document.getElementById(id)?.textContent),
  );
  assert(descriptions.every(Boolean));
  assert(descriptions.some((text) => text.includes('Enter a display name')));
  assert.equal(await input.inputValue(), 'Retained draft');
  assert.equal(
    await page.evaluate(() => document.activeElement.textContent),
    'Simulate validation error',
  );
  report.cases.push({ fieldError: true, associatedHintAndError: true, noStatusFocusSteal: true });
  await profile.getByRole('button', { name: 'Simulate conflict', exact: true }).click();
  await profile.getByRole('button', { name: 'Review latest profile', exact: true }).click();
  assert.equal(await input.inputValue(), 'Retained draft');
  report.cases.push({ conflictReviewRetainsDraft: true });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await profile.getByRole('button', { name: 'Simulate saving', exact: true }).click();
  assert(await profile.getByRole('button', { name: 'Saving…', exact: true }).isDisabled());
  assert.equal(await input.getAttribute('aria-disabled'), 'true');
  const indicators = profile.getByTestId('progress-indicator');
  const running = async () =>
    profile.evaluate(
      (el) =>
        el.getAnimations({ subtree: true }).filter((animation) => animation.playState === 'running')
          .length,
    );
  await page.waitForFunction(() => {
    const root = document.querySelector('[data-testid="RN07_PROFILE_SPECIMEN_ONLY"]');
    return root
      .getAnimations({ subtree: true })
      .every((animation) => animation.playState !== 'running');
  });
  const stoppedCount = await running();
  assert.equal(stoppedCount, 0);
  assert((await indicators.count()) >= 1);
  report.cases.push({
    reducedMotion: true,
    runningAnimations: stoppedCount,
    busyControlsDisabled: true,
  });
  await profile.getByRole('button', { name: 'Reset profile example', exact: true }).click();
  await input.fill('L'.repeat(80));
  await profile.getByRole('button', { name: 'Save changes', exact: true }).click();
  const stress = await page.addStyleTag({
    content:
      '[data-profile-preview] [dir="auto"]{font-size:24px!important;line-height:36px!important}[data-profile-preview] [role="heading"]{font-size:48px!important;line-height:58px!important}',
  });
  await input.focus();
  const longLayout = await profile.locator('[data-profile-preview]').evaluate((el) => {
    const region = el.querySelector('[role="region"]');
    return {
      width: el.clientWidth,
      height: region.clientHeight,
      scrollHeight: region.scrollHeight,
      overflow: el.scrollWidth > el.clientWidth,
    };
  });
  assert(
    !longLayout.overflow && longLayout.height > 800 && longLayout.scrollHeight > longLayout.height,
  );
  assert.equal(await input.inputValue(), 'L'.repeat(80));
  await profile
    .locator('[data-profile-preview]')
    .screenshot({ path: `${output}profile-long-name-320.png` });
  report.cases.push({
    longDisplayName: 80,
    browserTextStress: true,
    singleScrollOwner: longLayout,
  });
  await stress.evaluate((el) => el.remove());
  const home = page.getByTestId('RN09_HOME_SPECIMEN_ONLY');
  await home.getByLabel('Home example state').selectOption('Figma example');
  function luminance(rgb) {
    const [r, g, b] = rgb
      .match(/[\d.]+/g)
      .slice(0, 3)
      .map(Number)
      .map((v) => {
        const s = v / 255;
        return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  for (const [label, locator, minimum] of [
    ['Dino percentage', home.getByText('85%', { exact: true }), 4.5],
    ['Weekly hours', home.getByText('5', { exact: true }), 4.5],
    ['Quest badge', home.getByText('⚡ QUEST', { exact: true }), 4.5],
    ['Feed price badge', home.getByText('-10 ✦', { exact: true }), 4.5],
  ]) {
    const colors = await locator.evaluate((el) => {
      let node = el;
      let background;
      while (node) {
        const c = getComputedStyle(node).backgroundColor;
        if (c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent') {
          background = c;
          break;
        }
        node = node.parentElement;
      }
      return { foreground: getComputedStyle(el).color, background };
    });
    const a = luminance(colors.foreground),
      b = luminance(colors.background);
    const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    assert(ratio >= minimum);
    report.cases.push({ contrast: label, ...colors, ratio, minimum });
  }
  await home.locator('[data-home-capture]').screenshot({ path: `${output}home-readable-text.png` });
  const protection = page.getByTestId('RN08_PROTECTION_SPECIMEN_ONLY');
  await protection.getByLabel('Simulated device state').selectOption('Checking');
  await protection.getByRole('status').waitFor();
  report.cases.push({ nonErrorStatusRole: true, nativeSpeechNotInferred: true });
  assert.deepEqual(report.pageErrors, []);
  assert.deepEqual(report.privateRequests, []);
  await writeFile(`${output}browser-results.json`, `${JSON.stringify(report, null, 2)}\n`);
  console.log(
    `RN-10 passed ${report.cases.length} browser cases; no page errors or private requests.`,
  );
} finally {
  await browser.close();
}
