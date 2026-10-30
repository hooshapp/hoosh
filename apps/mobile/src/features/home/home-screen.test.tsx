import { act, fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import { Dimensions, Text } from 'react-native';

import HomeRoute from '@/app/(tabs)/index';

import { homeExample } from './__tests__/fixtures';
import { unavailableHome } from './home-model';
import { HomeScreen } from './home-screen';

const originalWindow = Dimensions.get('window');
beforeEach(() => Dimensions.set({ window: { width: 393, height: 852, scale: 3, fontScale: 1 } }));
afterEach(async () => {
  await act(() => Dimensions.set({ window: originalWindow }));
});

test('the actual Home route never renders design outcomes or activates product actions', async () => {
  await render(<HomeRoute />);
  expect(screen.getByRole('header', { name: 'Dino health' })).toBeVisible();
  expect(screen.getByRole('button', { name: 'Feed Dino' })).toBeDisabled();
  expect(screen.queryByTestId('home-dino-artwork', { includeHiddenElements: true })).toBeNull();
  expect(screen.queryByTestId('home-streak-dots', { includeHiddenElements: true })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Accept' })).toBeNull();
  expect(screen.queryByText('85%')).toBeNull();
  expect(screen.queryByText('240')).toBeNull();
  expect(screen.queryByText('🔥 7 days')).toBeNull();
  expect(screen.getByRole('header', { name: 'Protection unavailable' })).toBeVisible();
});
test('displays explicit values, original asset bounds, measurement context and singular day', async () => {
  await render(<HomeScreen model={homeExample} />);
  expect(screen.getByLabelText('Dino health 42%')).toBeOnTheScreen();
  expect(screen.getByLabelText('Credits: 19')).toBeOnTheScreen();
  expect(screen.getByText('1.5')).toBeVisible();
  expect(screen.getByText('Test range · Synthetic source · Synthetic coverage')).toBeVisible();
  expect(screen.getByText('🔥 1 day')).toBeVisible();
  expect(screen.getByTestId('home-dino-artwork', { includeHiddenElements: true })).toHaveStyle({
    width: 110,
    height: 110,
  });
  expect(screen.getByTestId('home-heart', { includeHiddenElements: true })).toHaveStyle({
    width: 12,
    height: 12,
  });
  expect(screen.getByTestId('home-ellipse', { includeHiddenElements: true })).toHaveStyle({
    width: 110,
    height: 110,
  });
  expect(screen.getByTestId('home-accept-check', { includeHiddenElements: true })).toHaveStyle({
    width: 16,
    height: 16,
  });
});
test('requires real handlers even when all display data is ready', async () => {
  await render(<HomeScreen model={homeExample} />);
  expect(screen.getByRole('button', { name: 'Feed Dino for 3 credits' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Accept' })).toBeDisabled();
  expect(screen.getByRole('button', { name: '✕ Skip' })).toBeDisabled();
  expect(screen.queryByRole('button', { name: 'View time saved in History' })).toBeNull();
});
test('delegates explicit intent without saving a quest, debiting credits or altering native status', async () => {
  const onFeed = jest.fn(),
    onAccept = jest.fn(),
    onSkip = jest.fn(),
    onOpenHistory = jest.fn();
  await render(
    <HomeScreen
      model={homeExample}
      onFeed={onFeed}
      onAcceptRecommendation={onAccept}
      onSkipRecommendation={onSkip}
      onOpenHistory={onOpenHistory}
    />,
  );
  await userEvent.press(screen.getByRole('button', { name: 'Feed Dino for 3 credits' }));
  await userEvent.press(screen.getByRole('button', { name: 'Accept' }));
  await userEvent.press(screen.getByRole('button', { name: '✕ Skip' }));
  await userEvent.press(screen.getByRole('button', { name: 'View time saved in History' }));
  expect(onFeed).toHaveBeenCalledTimes(1);
  expect(onOpenHistory).toHaveBeenCalledTimes(1);
  expect(onAccept).toHaveBeenCalledWith('RN09_HOME_TEST_ONLY');
  expect(onSkip).toHaveBeenCalledWith('RN09_HOME_TEST_ONLY');
  expect(screen.getByLabelText('Credits: 19')).toBeOnTheScreen();
  expect(screen.getByText('A short walk')).toBeVisible();
  expect(screen.queryByText('Protection active')).toBeNull();
});
test('blocks controlled busy actions and does not render an actionable check decoration while busy', async () => {
  const onAction = jest.fn();
  await render(
    <HomeScreen
      model={homeExample}
      onFeed={onAction}
      onAcceptRecommendation={onAction}
      onSkipRecommendation={onAction}
      feeding
      recommendationBusy
    />,
  );
  expect(screen.getByRole('button', { name: 'Feed Dino for 3 credits' })).toBeBusy();
  for (const button of screen.getAllByRole('button')) {
    expect(button).toBeDisabled();
    await userEvent.press(button);
  }
  expect(screen.queryByTestId('home-accept-check', { includeHiddenElements: true })).toBeNull();
  expect(onAction).not.toHaveBeenCalled();
});
test.each(['loading', 'error', 'unavailable'] as const)(
  'a %s update removes earlier ready values rather than retaining example outcomes',
  async (state) => {
    const view = await render(<HomeScreen model={homeExample} />);
    await view.rerender(
      <HomeScreen
        model={{
          dino: { state },
          credits: { state },
          weekly: { state },
          streak: { state },
          recommendation: { state },
        }}
      />,
    );
    expect(screen.queryByText('42%')).toBeNull();
    expect(screen.queryByText('19')).toBeNull();
    expect(screen.queryByText('A short walk')).toBeNull();
    expect(screen.queryByText('🔥 1 day')).toBeNull();
    expect(screen.queryByTestId('home-weekly-provenance')).toBeNull();
    if (state === 'loading') expect(screen.getByText('Finding recommendations…')).toBeVisible();
    if (state === 'error')
      expect(screen.getByRole('header', { name: 'Couldn’t load recommendations' })).toBeVisible();
  },
);
test('empty recommendations are distinct from a failure and never create an accepted quest', async () => {
  await render(<HomeScreen model={{ ...unavailableHome, recommendation: { state: 'empty' } }} />);
  expect(screen.getByRole('header', { name: 'No recommendations right now' })).toBeVisible();
  expect(screen.queryByRole('button', { name: 'Accept' })).toBeNull();
});
test('unknown credits or insufficient balance prevent Feed without disabling unrelated regions', async () => {
  const onFeed = jest.fn();
  const view = await render(
    <HomeScreen model={{ ...homeExample, credits: { state: 'error' } }} onFeed={onFeed} />,
  );
  expect(screen.getByRole('button', { name: 'Feed Dino for 3 credits' })).toBeDisabled();
  expect(screen.getByText('A short walk')).toBeVisible();
  await view.rerender(
    <HomeScreen
      model={{ ...homeExample, credits: { state: 'ready', value: 2 } }}
      onFeed={onFeed}
    />,
  );
  expect(screen.getByRole('button', { name: 'Feed Dino for 3 credits' })).toBeDisabled();
  await view.rerender(
    <HomeScreen
      model={{ ...homeExample, credits: { state: 'ready', value: 3 } }}
      onFeed={onFeed}
    />,
  );
  expect(screen.getByRole('button', { name: 'Feed Dino for 3 credits' })).toBeEnabled();
});
test('omits unapproved reward/restriction claims and disables Feed when its cost is unknown', async () => {
  if (homeExample.dino.state !== 'ready' || homeExample.recommendation.state !== 'ready')
    throw new Error('Fixture');
  await render(
    <HomeScreen
      model={{
        ...homeExample,
        dino: { state: 'ready', value: { ...homeExample.dino.value, feedCost: null } },
        recommendation: {
          state: 'ready',
          value: {
            ...homeExample.recommendation.value,
            rewardCredits: null,
            restrictionNotice: null,
          },
        },
      }}
      onFeed={jest.fn()}
    />,
  );
  expect(screen.getByRole('button', { name: 'Feed Dino' })).toBeDisabled();
  expect(screen.queryByText('+6 ✦')).toBeNull();
  expect(screen.queryByText('Synthetic notice only')).toBeNull();
});
test('does not infer a completed recent week from a seven-day streak', async () => {
  const view = await render(
    <HomeScreen
      model={{
        ...homeExample,
        streak: { state: 'ready', value: { days: 7, recentWeekComplete: false } },
      }}
    />,
  );
  expect(screen.queryByTestId('home-streak-dots', { includeHiddenElements: true })).toBeNull();
  await view.rerender(
    <HomeScreen
      model={{
        ...homeExample,
        streak: { state: 'ready', value: { days: 7, recentWeekComplete: true } },
      }}
    />,
  );
  expect(screen.getByTestId('home-streak-dots', { includeHiddenElements: true })).toHaveStyle({
    width: 86,
    height: 8,
  });
});
test('keeps semantic values when source artwork fails and supplies no replacement glyph', async () => {
  await render(<HomeScreen model={homeExample} />);
  await fireEvent(
    screen.getByTestId('home-dino-artwork', { includeHiddenElements: true }),
    'error',
    { nativeEvent: { error: 'Synthetic image failure' } },
  );
  await fireEvent(screen.getByTestId('home-heart', { includeHiddenElements: true }), 'error', {
    nativeEvent: { error: 'Synthetic image failure' },
  });
  expect(screen.queryByTestId('home-dino-artwork', { includeHiddenElements: true })).toBeNull();
  expect(screen.queryByTestId('home-heart', { includeHiddenElements: true })).toBeNull();
  expect(screen.getByText('Illustration unavailable')).toBeVisible();
  expect(screen.getByLabelText('Dino health 42%')).toBeOnTheScreen();
});
test('stacks by the actual content width and returns to the source columns at sufficient width', async () => {
  await render(<HomeScreen model={homeExample} />);
  await fireEvent(screen.getByTestId('home-content'), 'layout', {
    nativeEvent: { layout: { width: 288 } },
  });
  expect(screen.getByTestId('home-overview')).toHaveStyle({ flexDirection: 'column' });
  await fireEvent(screen.getByTestId('home-content'), 'layout', {
    nativeEvent: { layout: { width: 361 } },
  });
  expect(screen.getByTestId('home-overview')).toHaveStyle({ flexDirection: 'row' });
});
test('Home values do not grant protection or overwrite the injected native-owned region', async () => {
  await render(
    <HomeScreen
      model={homeExample}
      protection={<Text>Permission needed from native owner</Text>}
    />,
  );
  expect(screen.getByText('Permission needed from native owner')).toBeVisible();
  expect(screen.queryByText('Protection active')).toBeNull();
});

test('enlarged native font scale stacks even when the content width is sufficient', async () => {
  await render(<HomeScreen model={homeExample} />);
  await fireEvent(screen.getByTestId('home-content'), 'layout', {
    nativeEvent: { layout: { width: 361 } },
  });
  await act(() => Dimensions.set({ window: { width: 393, height: 852, scale: 3, fontScale: 2 } }));
  expect(screen.getByTestId('home-overview')).toHaveStyle({ flexDirection: 'column' });
});
