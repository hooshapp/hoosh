import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

/** Android/web use live regions; iOS needs an explicit, queued announcement. */
export function useAnnouncement(message: string | undefined) {
  const previous = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (message && message !== previous.current && Platform.OS === 'ios') {
      AccessibilityInfo.announceForAccessibilityWithOptions(message, { queue: true });
    }
    previous.current = message;
  }, [message]);
}
