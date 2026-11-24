import { useLayoutEffect, useState } from 'react';
import { PanResponder, View } from 'react-native';
import type { IntroSurfaceProps } from './IntroSurface.types';

export function IntroSurface({ children, enabled, onScrollGesture, onScrollProgress }: IntroSurfaceProps) {
  const [latest] = useState(() => ({ enabled, onScrollGesture, onScrollProgress }));
  useLayoutEffect(() => { Object.assign(latest, { enabled, onScrollGesture, onScrollProgress }); },
    [latest, enabled, onScrollGesture, onScrollProgress]);
  const [responder] = useState(() => {
    const initial = { x: 0, y: 0 };
    const claim = (_: unknown, gesture: { dx: number; dy: number; numberActiveTouches: number }) => {
      const accept = latest.enabled && gesture.numberActiveTouches === 1 &&
        gesture.dy <= -8 && Math.abs(gesture.dy) > Math.abs(gesture.dx);
      if (accept) Object.assign(initial, { x: gesture.dx, y: gesture.dy });
      return accept;
    };
    return PanResponder.create({
      // Capture vertical drags before the full-screen child can consume them.
      // Taps remain unclaimed so Skip and Continue still receive presses.
      onMoveShouldSetPanResponderCapture: claim,
      onMoveShouldSetPanResponder: claim,
      onPanResponderGrant: () => latest.onScrollProgress?.(Math.min(1, -initial.y / 100)),
      onPanResponderMove: (_, gesture) => {
        const dy = initial.y + gesture.dy;
        latest.onScrollProgress?.(gesture.numberActiveTouches === 1
          ? Math.min(1, Math.max(0, -dy / 100)) : 0);
      },
      onPanResponderRelease: (_, gesture) => {
        const dy = initial.y + gesture.dy, dx = initial.x + gesture.dx;
        Object.assign(initial, { x: 0, y: 0 });
        if (latest.enabled && dy <= -8 && -dy > Math.abs(dx)) latest.onScrollGesture(-dy);
        else latest.onScrollProgress?.(0);
      },
      onPanResponderTerminate: () => { Object.assign(initial, { x: 0, y: 0 }); latest.onScrollProgress?.(0); },
      onPanResponderTerminationRequest: () => false,
    });
  });
  return <View collapsable={false} testID="intro-gesture-surface" style={{ flex: 1 }} {...responder.panHandlers}>{children}</View>;
}
