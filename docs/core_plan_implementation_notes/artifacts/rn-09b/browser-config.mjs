export const config = {
  marker: 'RN09B_QUESTS_SPECIMEN_ONLY',
  capture: '[data-quests-capture]',
  phone: '[data-quests-phone]',
  select: 'Quests example state',
  states: [
    'Unavailable',
    'Loading',
    'Read error',
    'Empty',
    'Figma example',
    'No handlers',
    'Busy',
    'Saved example',
    'Long text',
  ],
  assets: [
    { id: 'quest-pencil', file: 'icons/quests/pencil.svg', width: 14, height: 14 },
    { id: 'quest-check', file: 'icons/home/check.svg', width: 16, height: 16 },
  ],
  async checkState(section, state, assert) {
    if (['Unavailable', 'Loading', 'Read error', 'Empty', 'Saved example'].includes(state))
      assert.equal(await section.getByText('Evening Gym Session', { exact: true }).count(), 0);
    if (state === 'Empty')
      await section.getByRole('heading', { name: 'No suggestions right now' }).waitFor();
    if (state === 'No handlers' || state === 'Busy')
      for (const button of await section.locator('[data-quests-phone]').getByRole('button').all())
        assert(await button.isDisabled());
  },
  async actions(section, assert) {
    for (const name of [
      'Accept Evening Gym Session',
      'Personalize Nightly Reading Session',
      'Create a custom quest',
    ]) {
      await section.getByRole('button', { name, exact: true }).click();
      await section
        .getByText('Preview intent only. No quest saved, apps restricted or credits awarded.', {
          exact: true,
        })
        .waitFor();
      assert.equal(await section.getByText('Saved quests', { exact: true }).count(), 0);
      await section.getByText('Evening Gym Session', { exact: true }).waitFor();
    }
  },
};
export const runtime = [
  'src/app/(tabs)/quests.tsx',
  'src/design/quest-assets.ts',
  'src/features/quests/quests-model.ts',
  'src/features/quests/quest-card.tsx',
  'src/features/quests/quests-screen.tsx',
];
