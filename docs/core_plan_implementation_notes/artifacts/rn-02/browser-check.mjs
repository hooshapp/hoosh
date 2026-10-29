import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// Optional evidence runner. Point PLAYWRIGHT_MODULE at an installed Playwright module;
// it is not an app/runtime dependency. Serve the Expo export on 8092 and UI on 8091.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const output = fileURLToPath(new URL('./', import.meta.url));
const tabs = ['Home', 'Quests', 'History', 'Settings'];
const paths = ['/', '/quests', '/history', '/settings'];
const headings = ['Disconnect', 'Your Quests', 'Your progress', 'Settings'];
const report = {
  browser: browser.version(),
  cases: [],
  errors: [],
  expectedImageFailures: 0,
  baselineWarnings: [],
};

function watchErrors(page, allowFailedSvgRequests = false) {
  page.on('pageerror', (error) => report.errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    if (message.location().url.endsWith('/favicon.ico') && message.text().includes('404')) {
      report.baselineWarnings.push({
        url: message.location().url,
        issue: 'Pre-existing web favicon is absent.',
      });
      return;
    }
    if (allowFailedSvgRequests && message.text().includes('net::ERR_FAILED'))
      report.expectedImageFailures++;
    else report.errors.push(message.text());
  });
}

async function settleImages(page) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() =>
    [...document.querySelectorAll('[data-testid="main-tab-bar"] img')].every(
      (image) => image.complete && image.naturalWidth > 0,
    ),
  );
}

try {
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 393, height: 852 },
    { width: 430, height: 932 },
  ]) {
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
    await context.route('**/*', (route) =>
      new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort(),
    );
    const page = await context.newPage();
    watchErrors(page);
    await page.goto('http://127.0.0.1:8092/');
    for (let index = 0; index < tabs.length; index++) {
      const tab = page.getByRole('tab', { name: tabs[index], exact: true });
      await tab.click();
      await page.getByRole('heading', { name: headings[index], exact: true }).waitFor();
      await settleImages(page);
      await tab.evaluate((node) => node.blur());
      await page.mouse.move(0, 0);
      await page.waitForFunction(() =>
        [...document.querySelectorAll('[data-testid="main-tab-bar"] [role="tab"]')].every(
          (node) => parseFloat(getComputedStyle(node).opacity) > 0.99,
        ),
      );
      assert.equal(new URL(page.url()).pathname, paths[index]);
      assert.equal(await tab.getAttribute('aria-selected'), 'true');
      assert.equal(await page.getByRole('tab', { selected: true }).count(), 1);
      const panel = page.getByRole('tabpanel', { name: tabs[index], exact: true });
      await panel.waitFor();
      assert.equal(await tab.getAttribute('aria-controls'), await panel.getAttribute('id'));
      const geometry = await page.getByTestId('main-tab-bar').evaluate((bar) => {
        const rect = (node) => {
          const r = node.getBoundingClientRect();
          return {
            x: r.x,
            y: r.y,
            width: r.width,
            height: r.height,
            bottom: r.bottom,
            right: r.right,
          };
        };
        const scroll = [...document.querySelectorAll('div')].find(
          (node) =>
            /auto|scroll/.test(getComputedStyle(node).overflowY) &&
            node.getBoundingClientRect().height > 0 &&
            node.firstElementChild &&
            getComputedStyle(node.firstElementChild).paddingBottom !== '0px',
        );
        return {
          bar: rect(bar),
          targets: [...bar.querySelectorAll('[role="tab"]')].map(rect),
          icons: [...bar.querySelectorAll('img')].map((image) => ({
            ...rect(image),
            loaded: image.complete && image.naturalWidth > 0,
            source: image.getAttribute('src'),
          })),
          label: bar.innerText.trim(),
          contentPadding: scroll
            ? parseFloat(getComputedStyle(scroll.firstElementChild).paddingBottom)
            : null,
          horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
        };
      });
      assert.equal(geometry.bar.x, 20);
      assert.equal(geometry.bar.width, viewport.width - 40);
      assert.equal(geometry.bar.height, 62);
      assert.equal(geometry.bar.bottom, viewport.height - 28);
      assert.equal(geometry.horizontalOverflow, false);
      assert.equal(geometry.label, tabs[index]);
      assert.equal(geometry.contentPadding, geometry.bar.height + 28 + 24);
      assert(geometry.targets.every((target) => target.width >= 44 && target.height >= 44));
      assert(geometry.icons.every((icon) => icon.loaded && icon.source.startsWith('/assets/')));
      assert.equal(geometry.icons.length, 4);
      assert(Math.abs(geometry.icons[0].width - 20.5) < 0.02);
      assert(Math.abs(geometry.icons[0].height - 20.7758) < 0.02);
      assert(geometry.icons.slice(1).every((icon) => icon.width === 20 && icon.height === 20));
      report.cases.push({ viewport, tab: tabs[index], ...geometry });
      if (viewport.width === 393)
        await page
          .getByTestId('main-tab-bar')
          .screenshot({ path: output + `bar-${tabs[index].toLowerCase()}.png` });
      if (
        (viewport.width === 320 && index === 0) ||
        (viewport.width === 393 && index === 2) ||
        (viewport.width === 430 && index === 3)
      )
        await page.screenshot({ path: output + `navigation-${viewport.width}.png` });
    }
    // An active-tab reselect must not add a duplicate history entry.
    await page.getByRole('tab', { name: 'Settings', exact: true }).click();
    for (const tab of ['History', 'Quests', 'Home']) {
      await page.goBack();
      await page.getByRole('tab', { name: tab, exact: true, selected: true }).waitFor();
    }
    for (let index = 0; index < tabs.length; index++) {
      await page.goto('http://127.0.0.1:8092' + paths[index]);
      await page.getByRole('tab', { name: tabs[index], exact: true, selected: true }).waitFor();
      await settleImages(page);
    }
    // Warm the route modules in this document after the fresh direct-link reloads.
    for (const tab of tabs) {
      await page.getByRole('tab', { name: tab, exact: true }).click();
      await page.getByRole('tab', { name: tab, exact: true, selected: true }).waitFor();
      await settleImages(page);
    }
    // Offline transitions use already loaded routes/assets; this is not PWA reload acceptance.
    await context.setOffline(true);
    for (const tab of tabs) {
      await page.getByRole('tab', { name: tab, exact: true }).click();
      await page.getByRole('tab', { name: tab, exact: true, selected: true }).waitFor();
      await settleImages(page);
    }
    await context.setOffline(false);
    await page.getByRole('link', { name: 'View sign-in screen', exact: true }).click();
    await page.getByRole('heading', { name: 'Welcome back', exact: true }).waitFor();
    assert.equal(await page.getByTestId('main-tab-bar').isVisible(), false);
    await page.goBack();
    await page.getByRole('tab', { name: 'Settings', exact: true, selected: true }).waitFor();
    await page.evaluate(() => {
      for (const node of document.querySelectorAll('div'))
        if (
          node.scrollHeight > node.clientHeight &&
          /auto|scroll/.test(getComputedStyle(node).overflowY)
        )
          node.scrollTop = node.scrollHeight;
    });
    const lastAction = await page
      .getByRole('link', { name: 'View onboarding screen', exact: true })
      .boundingBox();
    const bar = await page.getByTestId('main-tab-bar').boundingBox();
    assert(lastAction.y + lastAction.height <= bar.y - 23);
    report.cases.push({
      viewport,
      checks:
        'browser back, reselect, four fresh direct links, warmed offline tabs, auth isolation/back, last action scroll clearance passed',
    });
    await page.getByRole('tab', { name: 'Settings', exact: true }).focus();
    assert.equal(
      await page.getByRole('tab', { name: 'Settings', exact: true }).getAttribute('tabindex'),
      '0',
    );
    assert.equal(
      await page.getByRole('tab', { name: 'Home', exact: true }).getAttribute('tabindex'),
      '-1',
    );
    assert.equal(
      await page
        .getByRole('tab', { name: 'Settings', exact: true })
        .evaluate((node) => getComputedStyle(node).outlineWidth),
      '2px',
    );
    await page.keyboard.press('Home');
    assert.equal(
      await page
        .getByRole('tab', { name: 'Home', exact: true })
        .evaluate((node) => node === document.activeElement),
      true,
    );
    assert.equal(
      await page.getByRole('tab', { name: 'Settings', exact: true }).getAttribute('aria-selected'),
      'true',
    );
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Space');
    await page.getByRole('tab', { name: 'Quests', exact: true, selected: true }).waitFor();
    await page.keyboard.press('End');
    await page.keyboard.press('Enter');
    await page.getByRole('tab', { name: 'Settings', exact: true, selected: true }).waitFor();
    report.cases.push({
      viewport,
      checks:
        'Keyboard roving tab stop, Home/End/Arrow focus, manual Space/Enter activation passed.',
    });
    await context.close();
  }

  const compact = await browser.newContext({ viewport: { width: 280, height: 568 } });
  const compactPage = await compact.newPage();
  watchErrors(compactPage);
  await compactPage.goto('http://127.0.0.1:8092/');
  await compactPage.getByTestId('main-tab-bar').waitFor();
  await settleImages(compactPage);
  const compactGeometry = await compactPage.getByTestId('main-tab-bar').evaluate((node) => ({
    height: node.getBoundingClientRect().height,
    wrap: getComputedStyle(node).flexWrap,
    label: node.innerText.trim(),
    overflow: document.documentElement.scrollWidth > innerWidth,
  }));
  assert.equal(compactGeometry.wrap, 'wrap');
  assert.equal(compactGeometry.overflow, false);
  assert(compactGeometry.height > 62);
  for (const label of tabs) assert(compactGeometry.label.includes(label));
  await compactPage.screenshot({ path: output + 'navigation-compact-280.png' });
  report.cases.push({
    viewport: { width: 280, height: 568 },
    compactGeometry,
    note: 'Compact responsive stress only, not native font scaling.',
  });
  await compact.close();

  const failures = await browser.newContext({ viewport: { width: 320, height: 568 } });
  await failures.route('**/*.svg', (route) => route.abort());
  const failurePage = await failures.newPage();
  watchErrors(failurePage, true);
  await failurePage.goto('http://127.0.0.1:8092/');
  await failurePage.getByTestId('main-tab-quests').getByText('Quests', { exact: true }).waitFor();
  await failurePage.getByRole('tab', { name: 'Quests', exact: true }).click();
  await failurePage.getByRole('heading', { name: 'Your Quests', exact: true }).waitFor();
  report.cases.push({
    checks:
      'Deliberately blocked local SVGs expose readable destination labels and retain navigation.',
  });
  await failures.close();

  const galleryContext = await browser.newContext({ viewport: { width: 1200, height: 1000 } });
  const galleryPage = await galleryContext.newPage();
  watchErrors(galleryPage);
  await galleryPage.goto('http://127.0.0.1:8091/');
  const gallery = galleryPage.getByRole('region', { name: 'Original Figma asset inventory' });
  await gallery.scrollIntoViewIfNeeded();
  await galleryPage.waitForFunction(
    () =>
      [...document.querySelectorAll('.asset-gallery img')].length === 12 &&
      [...document.querySelectorAll('.asset-gallery img')].every(
        (image) => image.complete && image.naturalWidth > 0,
      ),
  );
  const art = await gallery.locator('img').evaluateAll((images) =>
    images.map((image) => ({
      alt: image.alt,
      width: image.width,
      height: image.height,
      loaded: image.complete && image.naturalWidth > 0,
    })),
  );
  assert.equal(art.length, 12);
  assert.equal(art.filter((image) => image.width === 110 && image.height === 110).length, 4);
  await gallery.screenshot({ path: output + 'original-asset-gallery.png' });
  report.cases.push({
    artwork: art,
    checks:
      'All eight original nav glyphs and four unscored Dino variants decoded at source bounds.',
  });
  await galleryContext.close();
  assert.deepEqual(report.errors, []);
  report.result = 'passed';
  await writeFile(output + 'browser-results.json', JSON.stringify(report, null, 2) + '\n');
  console.log(
    `Browser checks passed: ${report.cases.length} cases; Chrome ${report.browser}; no unexpected page/console errors.`,
  );
} finally {
  await browser.close();
}
