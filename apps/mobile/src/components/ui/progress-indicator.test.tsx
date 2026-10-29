import { act, render, screen, waitFor } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';

import { ProgressIndicator } from './progress-indicator';

describe('ProgressIndicator', () => {
  afterEach(() => jest.restoreAllMocks());

  it('does not animate with reduced motion and removes its preference listener', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    const remove = jest.fn();
    jest.spyOn(AccessibilityInfo, 'addEventListener').mockReturnValue({ remove });
    const view = await render(<ProgressIndicator color="#111111" />);
    expect(screen.getByTestId('progress-indicator', { includeHiddenElements: true })).toHaveProp(
      'animating',
      false,
    );
    await view.unmount();
    expect(remove).toHaveBeenCalledTimes(1);
  });

  it('does not let a stale initial preference overwrite a newer OS event', async () => {
    let readPreference: (value: boolean) => void = () => {};
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockReturnValue(
      new Promise<boolean>((resolve) => {
        readPreference = resolve;
      }),
    );
    let changePreference: (value: boolean) => void = () => {};
    jest.spyOn(AccessibilityInfo, 'addEventListener').mockImplementation((event, handler) => {
      if (event === 'reduceMotionChanged') changePreference = handler;
      return { remove: jest.fn() };
    });
    await render(<ProgressIndicator color="#111111" />);
    await act(async () => {
      changePreference(true);
      readPreference(false);
    });
    await waitFor(() =>
      expect(screen.getByTestId('progress-indicator', { includeHiddenElements: true })).toHaveProp(
        'animating',
        false,
      ),
    );
  });
});
