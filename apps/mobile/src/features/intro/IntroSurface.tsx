import { useMemo } from 'react';
import { PanResponder, View } from 'react-native';
import type { IntroSurfaceProps } from './IntroSurface.types';

export function IntroSurface({ children, enabled, onScrollGesture }: IntroSurfaceProps) {
  const responder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => enabled && gesture.dy <= -8 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
    onPanResponderRelease: (_, gesture) => {
      if (enabled && Math.abs(gesture.dy) > Math.abs(gesture.dx)) onScrollGesture(-gesture.dy);
    },
    onPanResponderTerminationRequest: () => true,
  }), [enabled, onScrollGesture]);
  return <View style={{ flex: 1 }} {...responder.panHandlers}>{children}</View>;
}
