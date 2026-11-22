import onboardingHandle from '../../../assets/onboarding/plan/current/manual-range-handle.svg';
import { useEffect, useState } from 'react';
import { PanResponder, Platform, StyleSheet, View } from 'react-native';
import { DesignArtwork } from '@/components/ui/design-artwork';
import { planeditorAssets } from '@/design/planeditor-assets';
import { colors } from '@/design/tokens';
import { formatTime, minutesTime } from '@/features/editors/draft-utils';
export { minutesTime } from '../editors/draft-utils';
/** Two independent accessible/keyboard/drag controls. No installation or scheduling engine. */
export function TimeRangeControl({
  start,
  end,
  disabled = false,
  appearance = 'default',
  onChange,
}: {
  start: number;
  end: number;
  disabled?: boolean;
  appearance?: 'default' | 'onboarding';
  onChange: (start: number, end: number) => void;
}) {
  const [width, setWidth] = useState(0);
  const onboarding = appearance === 'onboarding';
  const source = !onboarding && start === 540 && end === 1320 && width >= 319;
  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={styles.root}>
      {source ? (
        <View style={{ alignItems: 'center' }}>
          <DesignArtwork asset={planeditorAssets.range} />
        </View>
      ) : (
        <>
          <View style={[styles.track, onboarding && { left: 12, right: 12, height: 8, backgroundColor: '#8C948F' }]} />
          <View
            style={[
              styles.fill,
              {
                left: onboarding ? 12 + (Math.min(start, end) / 1439) * Math.max(0, width - 24) : `${(Math.min(start, end) / 1439) * 100}%`,
                width: onboarding ? (Math.abs(end - start) / 1439) * Math.max(0, width - 24) : `${(Math.abs(end - start) / 1439) * 100}%`,
                height: onboarding ? 8 : 6,
                backgroundColor: onboarding ? '#33C759' : colors.action,
              },
            ]}
          />
        </>
      )}
      <Handle
        label="Start time"
        value={start}
        width={width}
        disabled={disabled}
        source={source}
        onboarding={onboarding}
        onChange={(value) => onChange(value, end)}
      />
      <Handle
        label="End time"
        value={end}
        width={width}
        disabled={disabled}
        source={source}
        onboarding={onboarding}
        onChange={(value) => onChange(start, value)}
      />
    </View>
  );
}
function Handle({
  label,
  value,
  width,
  disabled,
  source,
  onboarding,
  onChange,
}: {
  label: string;
  value: number;
  width: number;
  disabled: boolean;
  source: boolean;
  onboarding: boolean;
  onChange: (value: number) => void;
}) {
  const [gesture] = useState(() => createRangeGesture());
  useEffect(() => { gesture.update({ value, width: onboarding ? width + 20 : width, disabled, onChange }); }, [gesture, value, width, disabled, onChange, onboarding]);
  const [focused, setFocused] = useState(false);
  const change = (next: number) => {
    if (!disabled) onChange(Math.max(0, Math.min(1439, Math.round(next))));
  };
  const onKeyDown: NonNullable<React.ComponentProps<typeof View>['onKeyDown']> = (event) => {
    const key = event.nativeEvent.key;
    const step = ['ArrowRight', 'ArrowUp'].includes(key)
      ? 1
      : ['ArrowLeft', 'ArrowDown'].includes(key)
        ? -1
        : 0;
    if (step) {
      event.preventDefault();
      change(value + step);
    }
  };
  return (
    <View
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      {...gesture.panHandlers}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      accessibilityValue={{ min: 0, max: 1439, now: value, text: formatTime(minutesTime(value)) }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) =>
        change(value + (e.nativeEvent.actionName === 'increment' ? 1 : -1))
      }
      {...(Platform.OS === 'web'
        ? {
            tabIndex: disabled ? -1 : 0,
            role: 'slider' as const,
            'aria-label': label,
            'aria-valuemin': 0,
            'aria-valuemax': 1439,
            'aria-valuenow': value,
            onKeyDown,
          }
        : {})}
      style={[
        styles.handle,
        { left: onboarding ? 12 + (value / 1439) * Math.max(0, width - 24) - 22 : (value / 1439) * Math.max(0, width - 44) },
        focused && {
          outlineWidth: 2,
          outlineStyle: 'solid',
          outlineColor: colors.success,
          outlineOffset: 2,
        },
      ]}>
      {onboarding ? <DesignArtwork asset={{ source: onboardingHandle, width: 24, height: 24 }} /> : !source ? <View style={styles.thumb} /> : null}
    </View>
  );
}
type RangeGestureOptions = { value: number; width: number; disabled: boolean; onChange: (value: number) => void };
/** One imperative RN responder per handle: recreating it mid-drag loses dx history. */
function createRangeGesture() {
  let options: RangeGestureOptions | null = null;
  let origin = 0;
  const responder = PanResponder.create({
    onStartShouldSetPanResponder: () => Boolean(options && !options.disabled),
    onMoveShouldSetPanResponder: () => Boolean(options && !options.disabled),
    onPanResponderGrant: () => { origin = options?.value ?? 0; },
    onPanResponderMove: (_, event) => {
      if (options && !options.disabled) options.onChange(Math.max(0, Math.min(1439, Math.round(origin + event.dx / Math.max(options.width - 44, 1) * 1439))));
    },
  });
  return { panHandlers: responder.panHandlers, update: (next: RangeGestureOptions) => { options = next; } };
}
const styles = StyleSheet.create({
  root: { minHeight: 44, justifyContent: 'center' },
  track: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.divider,
  },
  fill: { position: 'absolute', height: 6, borderRadius: 3, backgroundColor: colors.action },
  handle: {
    position: 'absolute',
    top: 0,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.success,
    backgroundColor: 'white',
  },
});
