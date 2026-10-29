import { createContext, useContext, useId, useMemo, useState, type PropsWithChildren } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const floatingBarGeometry = { minHeight: 62, sideGap: 20, minBottomGap: 28 } as const;

export function floatingBarBottom(bottomInset: number) {
  return Math.max(bottomInset, floatingBarGeometry.minBottomGap);
}

type Metrics = { clearance: number; reportHeight: (height: number) => void; idPrefix: string };
const FloatingTabBarMetrics = createContext<Metrics | undefined>(undefined);

/** The measured bar plus its safe bottom gap; Screen adds its own safe inset once. */
export function FloatingTabBarProvider({ children }: PropsWithChildren) {
  const insets = useSafeAreaInsets();
  const idPrefix = useId();
  const [height, setHeight] = useState<number>(floatingBarGeometry.minHeight);
  const value = useMemo(
    () => ({
      clearance: height + floatingBarBottom(insets.bottom) - insets.bottom,
      reportHeight: setHeight,
      idPrefix,
    }),
    [height, insets.bottom, idPrefix],
  );
  return <FloatingTabBarMetrics.Provider value={value}>{children}</FloatingTabBarMetrics.Provider>;
}

export function useFloatingTabBarMetrics() {
  return useContext(FloatingTabBarMetrics);
}
