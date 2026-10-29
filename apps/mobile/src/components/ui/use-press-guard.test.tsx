import { act, renderHook } from '@testing-library/react-native';

import { usePressGuard } from './use-press-guard';

it('rejects same-turn duplicate presses and unlocks for a later deliberate press', async () => {
  const onPress = jest.fn();
  const { result } = await renderHook(() => usePressGuard(onPress, false));
  await act(async () => {
    result.current();
    result.current();
  });
  expect(onPress).toHaveBeenCalledTimes(1);
  await act(async () => {
    result.current();
  });
  expect(onPress).toHaveBeenCalledTimes(2);
});

it('uses the latest blocked state after a controller update', async () => {
  const onPress = jest.fn();
  const { result, rerender } = await renderHook<() => void, { blocked: boolean }>(
    ({ blocked }) => usePressGuard(onPress, blocked),
    {
      initialProps: { blocked: false },
    },
  );
  await rerender({ blocked: true });
  await act(async () => {
    result.current();
  });
  expect(onPress).not.toHaveBeenCalled();
  await rerender({ blocked: false });
  await act(async () => {
    result.current();
  });
  expect(onPress).toHaveBeenCalledTimes(1);
});
