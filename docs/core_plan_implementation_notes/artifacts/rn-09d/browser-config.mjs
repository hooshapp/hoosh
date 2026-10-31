import { runtime as questsRuntime } from '../rn-09b/browser-config.mjs';
import { runtime as historyRuntime } from '../rn-09c/browser-config.mjs';
export const config = {
  marker: 'RN09D_SETTINGS_SPECIMEN_ONLY',
  capture: '[data-settings-capture]',
  phone: '[data-settings-phone]',
  select: 'Settings example state',
  states: [
    'Unavailable',
    'Figma example',
    'Read only',
    'Loading',
    'Read error',
    'Empty values',
    'Partial',
    'Profile form',
    'Long text',
  ],
  assets: [
    {
      id: 'settings-avatar',
      file: 'account/settings-avatar.svg',
      width: 52,
      height: 52,
    },
    ...[
      'user',
      'gender',
      'apps',
      'activities',
      'calendar',
      'clock',
      'timer',
    ].map((name) => ({
      id: `settings-${name}`,
      file: `icons/settings/${name}.svg`,
      width: 18,
      height: 18,
    })),
    {
      id: 'settings-info',
      file: 'icons/settings/info.svg',
      width: 14,
      height: 14,
    },
    {
      id: 'settings-chevron',
      file: 'icons/settings/chevron.svg',
      width: 16,
      height: 16,
    },
  ],
  async checkState(section, state, assert) {
    const phone = section.locator('[data-settings-phone]');
    if (state === 'Unavailable') {
      assert.equal(
        await phone.getByText('Jordan Rivera', { exact: true }).count(),
        0,
      );
      assert.equal(
        await phone.getByText('Personal Info', { exact: true }).count(),
        0,
      );
      assert.equal(
        await phone.getByText('Calendar Connections', { exact: true }).count(),
        0,
      );
    }
    if (state === 'Unavailable' || state === 'Read only')
      assert.equal(await phone.getByRole('button').count(), 0);
    if (state === 'Empty values')
      assert.equal(
        await phone.getByText('Not set', { exact: true }).count(),
        5,
      );
    if (state === 'Partial') {
      assert.equal(
        await phone
          .getByText('Instagram, TikTok, YouTube', { exact: true })
          .count(),
        0,
      );
      await phone.getByText('Mon – Fri', { exact: true }).waitFor();
    }
    if (state === 'Profile form') {
      const field = phone.getByRole('textbox', { name: 'Display name' });
      await field.fill('Local preview draft');
      await phone
        .getByRole('button', { name: 'Save changes', exact: true })
        .click();
      await section
        .getByText(
          'Preview intent only. No account saved, plan installed, picker or calendar connected.',
          { exact: true },
        )
        .waitFor();
      assert.equal(await field.inputValue(), 'Local preview draft');
      await phone.getByText('Jordan Rivera', { exact: true }).waitFor();
    }
  },
  async actions(section) {
    const phone = section.locator('[data-settings-phone]');
    for (const label of [
      'Age. 24',
      'Distracting Apps. Instagram, TikTok, YouTube',
      'App Sessions. 2 sessions/day · 15 min each',
      'Connect Google Calendar. Not connected',
    ]) {
      await phone.getByRole('button', { name: label, exact: true }).click();
      await section
        .getByText(
          'Preview intent only. No account saved, plan installed, picker or calendar connected.',
          { exact: true },
        )
        .waitFor();
    }
    await phone
      .getByRole('region')
      .evaluate(() => document.activeElement?.blur());
    await phone.screenshot({
      path: new URL('./figma-bottom.png', import.meta.url).pathname,
    });
    await phone.getByRole('region').evaluate((el) => {
      el.scrollTop = 0;
    });
    await phone
      .getByRole('region')
      .evaluate(() => document.activeElement?.blur());
  },
};
export const runtime = [
  ...questsRuntime,
  ...historyRuntime,
  'src/app/(tabs)/settings.tsx',
  'src/design/settings-assets.ts',
  'src/features/settings/settings-model.ts',
  'src/features/settings/settings-row.tsx',
  'src/features/settings/settings-screen.tsx',
  'src/features/account/account-header.tsx',
  'src/features/account/profile-form.tsx',
];
