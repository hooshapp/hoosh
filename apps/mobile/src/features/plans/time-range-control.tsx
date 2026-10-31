import { useState } from 'react';
import { PanResponder, Platform, StyleSheet, View } from 'react-native';
import { DesignArtwork } from '@/components/ui/design-artwork';
import { planeditorAssets } from '@/design/planeditor-assets';
import { colors } from '@/design/tokens';
import { formatTime } from '@/features/editors/draft-utils';
export function minutesTime(value: number): string {
  return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
}
/** Two independent accessible/keyboard/drag controls. No installation or scheduling engine. */
export function TimeRangeControl({ start, end, disabled = false, onChange }: {
  start: number; end: number; disabled?: boolean; onChange: (start: number, end: number) => void;
}) {
  const [width, setWidth] = useState(0);
  const source = start === 540 && end === 1320 && width >= 319;
  return <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={styles.root}>
    {source ? <View style={{ alignItems: 'center' }}><DesignArtwork asset={planeditorAssets.range} /></View>
      : <><View style={styles.track} /><View style={[styles.fill, { left: `${Math.min(start, end) / 1439 * 100}%`, width: `${Math.abs(end - start) / 1439 * 100}%` }]} /></>}
    <Handle label="Start time" value={start} width={width} disabled={disabled} source={source} onChange={(value) => onChange(value, end)} />
    <Handle label="End time" value={end} width={width} disabled={disabled} source={source} onChange={(value) => onChange(start, value)} />
  </View>;
}
function Handle({ label, value, width, disabled, source, onChange }: {
  label: string; value: number; width: number; disabled: boolean; source: boolean; onChange: (value: number) => void;
}) {
  const [origin, setOrigin] = useState(value);
  const [focused, setFocused] = useState(false);
  const change = (next: number) => { if (!disabled) onChange(Math.max(0, Math.min(1439, Math.round(next)))); };
  const responder = PanResponder.create({ onStartShouldSetPanResponder: () => !disabled,
    onMoveShouldSetPanResponder: () => !disabled,
    onPanResponderGrant: () => { setOrigin(value); },
    onPanResponderMove: (_, gesture) => change(origin + gesture.dx / Math.max(width - 44, 1) * 1439),
  });
  const onKeyDown: NonNullable<React.ComponentProps<typeof View>['onKeyDown']> = (event) => {
    const key = event.nativeEvent.key;
    const step = ['ArrowRight', 'ArrowUp'].includes(key) ? 1 : ['ArrowLeft', 'ArrowDown'].includes(key) ? -1 : 0;
    if (step) { event.preventDefault(); change(value + step); }
  };
  return <View onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} {...responder.panHandlers} accessible accessibilityRole="adjustable" accessibilityLabel={label}
    accessibilityState={{ disabled }} accessibilityValue={{ min: 0, max: 1439, now: value, text: formatTime(minutesTime(value)) }}
    accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
    onAccessibilityAction={(e) => change(value + (e.nativeEvent.actionName === 'increment' ? 1 : -1))}
    {...(Platform.OS === 'web' ? { tabIndex: disabled ? -1 : 0, role: 'slider' as const,
      'aria-label': label, 'aria-valuemin': 0, 'aria-valuemax': 1439, 'aria-valuenow': value,
      onKeyDown,
    } : {})}
    style={[styles.handle, { left: value / 1439 * Math.max(0, width - 44) }, focused && { outlineWidth: 2, outlineStyle: 'solid', outlineColor: colors.success, outlineOffset: 2 }]}>
    {!source ? <View style={styles.thumb} /> : null}
  </View>;
}
const styles = StyleSheet.create({
  root: { minHeight: 44, justifyContent: 'center' },
  track: { position: 'absolute', left: 0, right: 0, height: 6, borderRadius: 3, backgroundColor: colors.divider },
  fill: { position: 'absolute', height: 6, borderRadius: 3, backgroundColor: colors.action },
  handle: { position: 'absolute', top: 0, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  thumb: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.success, backgroundColor: 'white' },
});
