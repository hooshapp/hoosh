import { useMemo } from 'react';
import { PanResponder, View } from 'react-native';
import type { IntroSurfaceProps } from './IntroSurface.types';

export function IntroSurface({ children, enabled, onScrollGesture }: IntroSurfaceProps) {
  const responder = useMemo(() => {
    const beforeGrant = { x: 0, y: 0 };
    return PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => {
        const claim = enabled && gesture.dy <= -8 && Math.abs(gesture.dy) > Math.abs(gesture.dx);
        if (claim) {
          // RN resets dx/dy at responder grant. Keep the movement that earned
          // the grant so a short intentional swipe still counts on release.
          beforeGrant.x = gesture.dx;
          beforeGrant.y = gesture.dy;
        }
        return claim;
      },
      onPanResponderRelease: (_, gesture) => {
        const dx = beforeGrant.x + gesture.dx;
        const dy = beforeGrant.y + gesture.dy;
        beforeGrant.x = beforeGrant.y = 0;
        if (enabled && dy <= -8 && Math.abs(dy) > Math.abs(dx)) onScrollGesture(-dy);
      },
      onPanResponderTerminate: () => { beforeGrant.x = beforeGrant.y = 0; },
      onPanResponderTerminationRequest: () => true,
    });
  }, [enabled, onScrollGesture]);
  return <View testID="intro-gesture-surface" style={{ flex: 1 }} {...responder.panHandlers}>{children}</View>;
}
