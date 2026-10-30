import { AccessibilityInfo, type HostInstance } from 'react-native';

import { focusControl } from './focus-control';

afterEach(() => jest.restoreAllMocks());
test('requests keyboard focus then native assistive focus for an explicit action', () => {
  const order: string[] = [];
  const control = { focus: jest.fn(() => order.push('keyboard')) } as unknown as HostInstance;
  const announce = jest
    .spyOn(AccessibilityInfo, 'sendAccessibilityEvent')
    .mockImplementation(() => {
      order.push('assistive');
    });
  focusControl(control);
  expect(order).toEqual(['keyboard', 'assistive']);
  expect(announce).toHaveBeenCalledWith(control, 'focus');
});
test('does not invent or search for a replacement control when its ref is absent', () => {
  const announce = jest
    .spyOn(AccessibilityInfo, 'sendAccessibilityEvent')
    .mockImplementation(() => {});
  focusControl(null);
  expect(announce).not.toHaveBeenCalled();
});
test('does not retry focus into another screen if the control has detached', () => {
  const focus = jest.fn(() => {
    throw new Error('Detached');
  });
  const announce = jest
    .spyOn(AccessibilityInfo, 'sendAccessibilityEvent')
    .mockImplementation(() => {});
  expect(() => focusControl({ focus } as unknown as HostInstance)).not.toThrow();
  expect(focus).toHaveBeenCalledTimes(1);
  expect(announce).not.toHaveBeenCalled();
});
test('an assistive focus failure cannot fail the underlying form action', () => {
  jest.spyOn(AccessibilityInfo, 'sendAccessibilityEvent').mockImplementation(() => {
    throw new Error('View replaced');
  });
  expect(() => focusControl({ focus: jest.fn() } as unknown as HostInstance)).not.toThrow();
});
