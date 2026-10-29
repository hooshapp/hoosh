import { useEffect, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator } from 'react-native';

/** The accompanying text owns the accessible status; this indicator is decorative. */
export function ProgressIndicator({ color }: { color: string }) {
  const [reduceMotion, setReduceMotion] = useState(true);

  useEffect(() => {
    let active = true;
    let preferenceChanged = false;
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (value) => {
      preferenceChanged = true;
      if (active) setReduceMotion(value);
    });
    void AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (active && !preferenceChanged) setReduceMotion(value);
      })
      .catch(() => {
        // Keep the conservative nonanimated state when the preference cannot be read.
      });
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return (
    <ActivityIndicator
      testID="progress-indicator"
      color={color}
      size="small"
      animating={!reduceMotion}
      accessible={false}
      aria-hidden
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}
