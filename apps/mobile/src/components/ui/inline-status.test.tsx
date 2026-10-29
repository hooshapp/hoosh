import { render, screen, userEvent } from '@testing-library/react-native';

import { EmptyCard } from './empty-card';
import { InlineStatus } from './inline-status';

describe('screen states', () => {
  it.each(['loading', 'saving'] as const)(
    'presents %s as busy information, not a fake action',
    async (state) => {
      await render(<InlineStatus state={state} message="Working…" />);
      expect(screen.getByText('Working…')).toBeBusy();
      expect(screen.queryByRole('progressbar')).not.toBeOnTheScreen();
      expect(screen.queryByRole('button')).not.toBeOnTheScreen();
    },
  );

  it('does not claim unavailable data is an empty or successful result', async () => {
    await render(<InlineStatus state="unavailable" message="Profile service is unavailable." />);
    expect(screen.getByText('Profile service is unavailable.')).toBeVisible();
    expect(screen.queryByRole('button')).not.toBeOnTheScreen();
  });

  it('offers a real retry, disables it while retrying, and can recover to content', async () => {
    const retry = jest.fn();
    const view = await render(
      <InlineStatus state="error" message="Could not load your profile." onRetry={retry} />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load your profile.');
    await userEvent.press(screen.getByRole('button', { name: 'Try again' }));
    expect(retry).toHaveBeenCalledTimes(1);
    await view.rerender(
      <InlineStatus
        state="error"
        message="Could not load your profile."
        onRetry={retry}
        retrying
      />,
    );
    expect(screen.getByRole('button', { name: 'Retrying…' })).toBeDisabled();
    await userEvent.press(screen.getByRole('button', { name: 'Retrying…' }));
    expect(retry).toHaveBeenCalledTimes(1);
    await view.rerender(
      <EmptyCard title="No profile yet" description="You can add your name when you are ready." />,
    );
    expect(screen.queryByRole('alert')).not.toBeOnTheScreen();
    expect(screen.getByRole('header', { name: 'No profile yet' })).toBeVisible();
    expect(screen.queryByRole('button')).not.toBeOnTheScreen();
  });
});
