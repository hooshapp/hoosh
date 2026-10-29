import { renderHook } from '@testing-library/react-native';
import { AccessibilityInfo, Platform } from 'react-native';

import { useAnnouncement } from './use-announcement';

it('can announce the same error again after it was cleared without duplicating unchanged messages', async () => {
  const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibilityWithOptions');
  const { rerender } = await renderHook<void, { message?: string }>(
    ({ message }) => useAnnouncement(message),
    { initialProps: { message: 'Email. Check this field.' } },
  );
  await rerender({ message: 'Email. Check this field.' });
  await rerender({});
  await rerender({ message: 'Email. Check this field.' });
  expect(announce).toHaveBeenCalledTimes(Platform.OS === 'ios' ? 2 : 0);
  announce.mockRestore();
});
