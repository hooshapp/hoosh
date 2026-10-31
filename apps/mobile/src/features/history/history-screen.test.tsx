import { render, screen, userEvent } from '@testing-library/react-native';
import HistoryRoute from '@/app/(tabs)/history';
import { HistoryScreen } from './history-screen';
import {
  isUsableMetric,
  isUsableComparison,
  unavailableHistory,
  type HistoryMetric,
  type HistoryModel,
} from './history-model';
const metric: HistoryMetric = {
  value: 7,
  display: '7',
  period: 'reported week',
  source: 'RN09C_TEST_ONLY',
  coverage: 'Whole reported period',
};
const ready: HistoryModel = {
  periodLabel: 'Reported week',
  turnOffs: { state: 'ready', data: metric },
  savedHours: { state: 'ready', data: { ...metric, value: 2, display: '2' } },
  screenTime: {
    state: 'ready',
    data: {
      eligible: true,
      before: { ...metric, display: '4h' },
      now: { ...metric, display: '1h' },
    },
  },
};
test('route exposes unavailable readings with no sample outcomes, forecast or dead next button', async () => {
  await render(<HistoryRoute />);
  expect(screen.getByRole('header', { name: 'Your stats' })).toBeVisible();
  expect(screen.getByText('Turn-offs isn’t available yet.')).toBeVisible();
  expect(screen.queryByText('51')).toBeNull();
  expect(screen.queryByText(/years/)).toBeNull();
  expect(
    screen.queryByRole('button', { name: 'Next history page' }),
  ).toBeNull();
});
test.each([NaN, Infinity, -1])(
  'invalid numerical reading %s is unavailable',
  (value) => expect(isUsableMetric({ ...metric, value })).toBe(false),
);
test.each(['display', 'period', 'source', 'coverage'] as const)(
  'missing %s prevents a measurement claim',
  (key) => expect(isUsableMetric({ ...metric, [key]: '  ' })).toBe(false),
);
test('real zero is retained and not interpreted as missing', async () => {
  await render(
    <HistoryScreen
      model={{
        ...unavailableHistory,
        turnOffs: {
          state: 'ready',
          data: { ...metric, value: 0, display: '0' },
        },
      }}
    />,
  );
  expect(screen.getByText('0')).toBeVisible();
});
test('unapproved comparison is suppressed independently of valid other readings', async () => {
  if (ready.screenTime.state !== 'ready')
    throw new Error('Expected ready test input');
  const data = { ...ready.screenTime.data, eligible: false };
  expect(isUsableComparison(data)).toBe(false);
  await render(
    <HistoryScreen
      model={{ ...ready, screenTime: { state: 'ready', data } }}
    />,
  );
  expect(screen.queryByText('4h')).toBeNull();
  expect(screen.getByText('7')).toBeVisible();
  expect(screen.getByText('2')).toBeVisible();
});
test('ready readings show supplied values and evidence without deriving saved time', async () => {
  await render(<HistoryScreen model={ready} />);
  expect(screen.getByText('4h')).toBeVisible();
  expect(screen.getByText('1h')).toBeVisible();
  expect(screen.getByText('2')).toBeVisible();
  expect(screen.getAllByText(/RN09C_TEST_ONLY/)).toHaveLength(4);
});
test.each(['loading', 'error', 'unavailable'] as const)(
  '%s replaces old values without an empty zero fallback',
  async (state) => {
    const view = await render(<HistoryScreen model={ready} />);
    await view.rerender(
      <HistoryScreen
        model={{
          periodLabel: null,
          turnOffs: { state },
          screenTime: { state },
          savedHours: { state },
        }}
      />,
    );
    expect(screen.queryByText('7')).toBeNull();
    expect(screen.queryByText('4h')).toBeNull();
    expect(screen.queryByText('0')).toBeNull();
  },
);
test('explicit next and error retry are delegated only', async () => {
  const next = jest.fn(),
    retry = jest.fn();
  await render(
    <HistoryScreen
      model={{ ...ready, savedHours: { state: 'error' } }}
      onNext={next}
      onRetry={retry}
    />,
  );
  await userEvent.press(
    screen.getByRole('button', { name: 'Next history page' }),
  );
  await userEvent.press(screen.getByRole('button', { name: 'Try again' }));
  expect(next).toHaveBeenCalledTimes(1);
  expect(retry).toHaveBeenCalledTimes(1);
  expect(screen.getByText('7')).toBeVisible();
});
