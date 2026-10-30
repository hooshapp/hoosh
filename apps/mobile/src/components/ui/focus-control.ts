import { AccessibilityInfo, Platform, type HostInstance } from 'react-native';

/** Explicit interaction only. Never call during ordinary revalidation/status changes. */
export function focusControl(control: HostInstance | null) {
  if (!control) return;
  try {
    control.focus();
    if (Platform.OS !== 'web') AccessibilityInfo.sendAccessibilityEvent(control, 'focus');
  } catch {
    // A navigation/account transition may detach this view after commit. Do not retry
    // into another screen or let an assistive-focus request break the original action.
  }
}
