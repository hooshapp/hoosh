import { useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import { formatTime } from './manual-plan';
import type { TimeRangeProps } from './TimeRangeSlider.types';

export function TimeRangeSlider({ start, end, onChange }: TimeRangeProps) {
  const [width, setWidth] = useState(0);
  const update = (kind: 'start' | 'end', value: number) => {
    if (kind === 'start') onChange(Math.max(0, Math.min(end - 1, value)), end);
    else onChange(start, Math.min(1439, Math.max(start + 1, value)));
  };
  return <View style={styles.root} onLayout={event => setWidth(event.nativeEvent.layout.width)}>
    <View style={styles.track} /><View style={[styles.selected, { left: `${start / 1439 * 100}%`, right: `${100 - end / 1439 * 100}%` }]} />
    <SliderThumb kind="start" value={start} width={width} onChange={update} /><SliderThumb kind="end" value={end} width={width} onChange={update} />
  </View>;
}
function SliderThumb({kind,value,width,onChange}:{kind:'start'|'end';value:number;width:number;onChange(kind:'start'|'end',value:number):void}) {
  const startAt = useRef(0);
  const latest = useRef({kind,value,width,onChange});
  useEffect(() => { latest.current = {kind,value,width,onChange}; }, [kind,value,width,onChange]);
  // PanResponder only registers callbacks here; refs are read on later gestures.
  // Keep its gesture state stable while the displayed values change.
  // eslint-disable-next-line react-hooks/refs, react-hooks/preserve-manual-memoization
  const responder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > Math.abs(gesture.dy),
    onPanResponderGrant: () => { startAt.current = latest.current.value; },
    onPanResponderMove: (_, gesture) => {
      const current = latest.current;
      if (current.width > 0) current.onChange(current.kind, Math.round((startAt.current + gesture.dx / current.width * 1439) / 5) * 5);
    },
  }), []);
  return <View {...responder.panHandlers} style={[styles.thumb, { left: Math.max(0, width - 22) * value / 1439 }]}
    accessible accessibilityRole="adjustable" accessibilityLabel={`${kind === 'start' ? 'Start' : 'End'} time slider`}
    accessibilityValue={{ min: 0, max: 1439, now: value, text: formatTime(value) }}
    accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
    onAccessibilityAction={event => onChange(kind, value + (event.nativeEvent.actionName === 'increment' ? 15 : -15))} />;
}
const styles = StyleSheet.create({ root: { height: 44, marginHorizontal: 8 }, track: { position: 'absolute', left: 0, right: 0, height: 6, top: 19, borderRadius: 3, backgroundColor: '#777777' }, selected: { position: 'absolute', top: 19, height: 6, backgroundColor: '#33C659' }, thumb: { position: 'absolute', top: 11, width: 22, height: 22, borderRadius: 11, borderWidth: 3, borderColor: '#33C659', backgroundColor: '#FFFFFF' } });
