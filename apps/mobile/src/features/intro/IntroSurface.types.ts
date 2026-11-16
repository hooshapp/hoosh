import type { ReactNode } from 'react';
export type IntroSurfaceProps = {
  children: ReactNode;
  enabled: boolean;
  onScrollGesture(distance: number): void;
};
