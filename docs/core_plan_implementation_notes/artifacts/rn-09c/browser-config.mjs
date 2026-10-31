export const config = {
  marker: 'RN09C_HISTORY_SPECIMEN_ONLY',
  capture: '[data-history-capture]',
  phone: '[data-history-phone]',
  select: 'History example state',
  states: [
    'Unavailable',
    'Loading',
    'Read error',
    'Figma example',
    'Zero',
    'Missing evidence',
    'Ineligible comparison',
    'Partial',
    'Long text',
  ],
  assets: [
    {
      id: 'history-comparison',
      file: 'icons/history/comparison.svg',
      width: 20,
      height: 20,
    },
    {
      id: 'history-next',
      file: 'icons/history/next.svg',
      width: 20,
      height: 20,
    },
    {
      id: 'history-pagination',
      file: 'icons/history/pagination.svg',
      width: 32,
      height: 8,
    },
  ],
  async checkState(section, state, assert) {
    if (
      [
        'Unavailable',
        'Loading',
        'Read error',
        'Zero',
        'Missing evidence',
      ].includes(state)
    )
      assert.equal(await section.getByText('51', { exact: true }).count(), 0);
    if (state === 'Zero')
      await section.getByText('0', { exact: true }).waitFor();
    if (state === 'Ineligible comparison')
      assert.equal(
        await section.getByText('12h 30m', { exact: true }).count(),
        0,
      );
    if (state === 'Partial') {
      await section.getByText('51', { exact: true }).waitFor();
      assert.equal(await section.getByText('10', { exact: true }).count(), 0);
    }
  },
  async actions(section) {
    await section.getByRole('button', { name: 'Next history page' }).click();
    await section
      .getByText(
        'Preview navigation intent only. No detail route or measurement loaded.',
        { exact: true },
      )
      .waitFor();
  },
};
export const runtime = [
  'src/app/(tabs)/history.tsx',
  'src/design/history-assets.ts',
  'src/features/history/history-model.ts',
  'src/features/history/history-screen.tsx',
];
