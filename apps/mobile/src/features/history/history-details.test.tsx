import { render, screen, userEvent } from '@testing-library/react-native';
import { HistoryDetails } from './history-details';
import { HistoryExperience } from './history-experience';
import {
  usableHistoryDetail,
  unavailableHistoryPeriods,
  type HistoryDetail,
} from './history-details-model';
import { unavailableHistory, type HistoryMetric } from './history-model';
const metric: HistoryMetric = {
  value: 10,
  display: '10',
  period: 'Test period',
  source: 'RN09H_TEST_ONLY',
  coverage: 'Test coverage',
};
const data: HistoryDetail = {
  eligible: true,
  baseline: { ...metric, value: 100 },
  current: { ...metric, value: 20 },
  savedHours: metric,
  reduction: { ...metric, value: 80, display: '80' },
  narrative: ['Supplied test narrative'],
};
test('zero baseline, missing evidence, unsupported percent and ineligibility suppress comparison claims', () => {
  expect(usableHistoryDetail({ ...data, baseline: { ...metric, value: 0 } })).toBe(false);
  expect(usableHistoryDetail({ ...data, reduction: { ...metric, value: 101 } })).toBe(false);
  expect(usableHistoryDetail({ ...data, current: { ...metric, coverage: '' } })).toBe(false);
  expect(usableHistoryDetail({ ...data, eligible: false })).toBe(false);
});
test('real page/period navigation never substitutes weekly data into unavailable month', async () => {
  await render(
    <HistoryExperience
      summary={unavailableHistory}
      periods={{ ...unavailableHistoryPeriods, week: { state: 'ready', data } }}
    />,
  );
  await userEvent.press(screen.getByRole('button', { name: 'Next history page' }));
  expect(screen.getByText('80')).toBeVisible();
  await userEvent.press(screen.getByRole('button', { name: 'This month' }));
  expect(screen.queryByText('80')).toBeNull();
  expect(screen.queryByText('Supplied test narrative')).toBeNull();
  await userEvent.press(screen.getByRole('button', { name: 'View time reclaimed' }));
  expect(screen.queryByText(/years/)).toBeNull();
  await userEvent.press(screen.getByRole('button', { name: 'Back' }));
  await userEvent.press(screen.getByRole('button', { name: 'This week' }));
  expect(screen.getByText('80')).toBeVisible();
});
test('reduction diagram uses supplied percentage and original circles, with no lifespan forecast', async () => {
  await render(
    <HistoryDetails
      reading={{ state: 'ready', data }}
      period="week"
      onPeriodChange={jest.fn()}
      onBack={jest.fn()}
      reclaimed
    />,
  );
  expect(screen.getByLabelText('80% less screen time')).toBeVisible();
  expect(screen.getByText('8 of 10 — time freed')).toBeVisible();
  expect(screen.getByText('2 of 10 — remaining')).toBeVisible();
  expect(screen.queryByText(/1.8|average male|Look ahead/)).toBeNull();
});
test('zero reduction remains a valid observed result, distinct from unavailability', async () => {
  await render(
    <HistoryDetails
      reading={{
        state: 'ready',
        data: { ...data, reduction: { ...metric, value: 0, display: '0' } },
      }}
      period="week"
      onPeriodChange={jest.fn()}
      onBack={jest.fn()}
      reclaimed
    />,
  );
  expect(screen.getByText('0 of 10 — time freed')).toBeVisible();
});
test('error retry is explicit and unavailability does not show stale figures', async () => {
  const retry = jest.fn();
  const view = await render(
    <HistoryDetails
      reading={{ state: 'error' }}
      period="week"
      onPeriodChange={jest.fn()}
      onBack={jest.fn()}
      onRetry={retry}
    />,
  );
  await userEvent.press(screen.getByRole('button', { name: 'Try again' }));
  expect(retry).toHaveBeenCalledTimes(1);
  await view.rerender(
    <HistoryDetails
      reading={{ state: 'unavailable' }}
      period="week"
      onPeriodChange={jest.fn()}
      onBack={jest.fn()}
    />,
  );
  expect(screen.queryByText('80')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
});
