import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE ?? 'playwright'
);
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const report = {
  browser: browser.version(),
  source: 'Actual Expo web export; no auth/account/device connected',
  cases: [],
  errors: [],
  privateRequests: [],
  deviceAcceptance: false,
};
const names = {
  Home: 'Dino health',
  Quests: 'Your Quests',
  History: 'Your stats',
  Settings: 'Settings',
};
try {
  const page = await browser.newPage({ viewport: { width: 393, height: 852 } });
  page.on('pageerror', (e) => report.errors.push(e.message));
  page.on('request', (r) => {
    if (/\/v1\//.test(r.url())) report.privateRequests.push(r.url());
  });
  await page.goto('http://127.0.0.1:8097/');
  const tab = (name) => page.getByRole('tab', { name, exact: true });
  await tab('Home').waitFor();
  await tab('Home').focus();
  await page.keyboard.press('ArrowRight');
  assert.equal(await tab('Home').getAttribute('aria-selected'), 'true');
  assert(await tab('Quests').evaluate((el) => el === document.activeElement));
  await page.keyboard.press('Space');
  await page
    .getByRole('heading', { name: names.Quests, exact: true })
    .waitFor();
  await page.keyboard.press('End');
  await page.keyboard.press('Enter');
  await page
    .getByRole('heading', { name: names.Settings, exact: true })
    .waitFor();
  await page.keyboard.press('Tab');
  assert.equal(
    await page.evaluate(() => document.activeElement.getAttribute('role')),
    'tabpanel',
  );
  await page.keyboard.press('Shift+Tab');
  assert(await tab('Settings').evaluate((el) => el === document.activeElement));
  report.cases.push({
    keyboard: 'manual activation and forward/backward tab-to-panel order',
    passed: true,
  });
  for (const width of [280, 320, 393, 430])
    for (const large of [false, true]) {
      await page.setViewportSize({ width, height: width === 320 ? 568 : 852 });
      const style = large
        ? await page.addStyleTag({
            content:
              '[dir="auto"]{font-size:24px!important;line-height:36px!important}',
          })
        : null;
      for (const name of Object.keys(names)) {
        await tab(name).click();
        await page
          .getByRole('heading', { name: names[name], exact: true })
          .waitFor();
        const panel = page.getByRole('tabpanel', { name, exact: true });
        assert.equal(await page.getByRole('tabpanel').count(), 1);
        assert.equal(
          await page.getByRole('tab', { selected: true }).count(),
          1,
        );
        const region = panel.getByRole('region').first();
        await region.evaluate((el) => {
          el.scrollTop = el.scrollHeight;
        });
        await page.waitForFunction(() => {
          const bar = document.querySelector('[data-testid="main-tab-bar"]');
          const panel = [
            ...document.querySelectorAll('[role="tabpanel"]'),
          ].find((el) => el.getAttribute('aria-hidden') !== 'true');
          const content =
            panel?.querySelector('[role="region"]')?.firstElementChild;
          return (
            bar &&
            content &&
            parseFloat(getComputedStyle(content).paddingBottom) >=
              bar.getBoundingClientRect().height + 28
          );
        });
        const layout = await panel.evaluate((el) => {
          const nav = document.querySelector('[data-testid="main-tab-bar"]');
          const bar = nav.getBoundingClientRect();
          const scroll = el.querySelector('[role="region"]');
          const content = scroll.firstElementChild;
          return {
            overflow: el.scrollWidth > el.clientWidth,
            barOverflow: nav.scrollWidth > nav.clientWidth + 1,
            paddingBottom: parseFloat(getComputedStyle(content).paddingBottom),
            barHeight: bar.height,
            lastBottom: content.lastElementChild.getBoundingClientRect().bottom,
            navTop: bar.top,
            targets: [...nav.querySelectorAll('[role="tab"]')].map((node) => {
              const r = node.getBoundingClientRect();
              return {
                width: r.width,
                height: r.height,
                inside: r.left >= bar.left && r.right <= bar.right + 1,
              };
            }),
          };
        });
        assert(!layout.overflow && !layout.barOverflow);
        assert(
          layout.lastBottom < layout.navTop,
          `${width}/${large}/${name}: footer covers content`,
        );
        for (const target of layout.targets)
          assert(target.width >= 44 && target.height >= 44 && target.inside);
        assert.equal(
          await panel.getByText('Jordan Rivera', { exact: true }).count(),
          0,
        );
        assert.equal(await panel.getByText('51', { exact: true }).count(), 0);
        assert.equal(
          await panel.getByText('Evening Gym Session', { exact: true }).count(),
          0,
        );
        assert.equal(
          await panel
            .getByRole('link', { name: 'View sign-in screen' })
            .count(),
          0,
        );
        report.cases.push({ width, large, tab: name, layout });
        if (width === 320 && large && name === 'Settings')
          await page.screenshot({
            path: new URL('./app-settings-320-large.png', import.meta.url)
              .pathname,
          });
      }
      if (style) await style.evaluate((el) => el.remove());
    }
  for (const path of ['quests', 'history', 'settings']) {
    await page.goto(`http://127.0.0.1:8097/${path}`);
    const name = path[0].toUpperCase() + path.slice(1);
    await page
      .getByRole('heading', { name: names[name], exact: true })
      .waitFor();
    assert.equal(await tab(name).getAttribute('aria-selected'), 'true');
    report.cases.push({ directLink: path, passed: true });
  }
  assert.deepEqual(report.errors, []);
  assert.deepEqual(report.privateRequests, []);
  await writeFile(
    new URL('./app-navigation-results.json', import.meta.url),
    JSON.stringify(report, null, 2) + '\n',
  );
  console.log(`Actual app navigation: ${report.cases.length} cases passed.`);
} finally {
  await browser.close();
}
