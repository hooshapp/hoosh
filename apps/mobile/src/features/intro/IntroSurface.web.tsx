import { useEffect, useRef } from 'react';
import type { IntroSurfaceProps } from './IntroSurface.types';

export function IntroSurface({ children, enabled, onScrollGesture }: IntroSurfaceProps) {
  const element = useRef<HTMLDivElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  useEffect(() => {
    const node = element.current;
    let distance = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    function wheel(event: WheelEvent) {
      if (!enabled || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      event.preventDefault();
      // A wheel burst is one gesture, including its momentum events.
      distance = Math.max(0, distance + event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? node?.clientHeight ?? 600 : 1));
      clearTimeout(timer);
      timer = setTimeout(() => { onScrollGesture(distance); distance = 0; }, 180);
    }
    node?.addEventListener('wheel', wheel, { passive: false });
    return () => { node?.removeEventListener('wheel', wheel); clearTimeout(timer); };
  }, [enabled, onScrollGesture]);
  return (
    <div ref={element} role="region" aria-label="Introduction" tabIndex={0}
      style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, touchAction: enabled ? 'none' : 'auto' }}
      onTouchStart={(event) => { const point = event.touches[0]; touch.current = point ? { x: point.clientX, y: point.clientY } : null; }}
      onTouchCancel={() => { touch.current = null; }}
      onTouchEnd={(event) => {
        const start = touch.current;
        touch.current = null;
        const end = event.changedTouches[0];
        if (enabled && start && end && Math.abs(end.clientY - start.y) > Math.abs(end.clientX - start.x)) onScrollGesture(start.y - end.clientY);
      }}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget || !enabled) return;
        if (['ArrowDown', 'PageDown', ' '].includes(event.key)) { event.preventDefault(); onScrollGesture(160); }
      }}>
      {children}
    </div>
  );
}
