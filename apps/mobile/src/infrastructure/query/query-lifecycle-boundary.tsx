import { type ReactNode, useEffect } from 'react';

import { attachQueryLifecycle } from './lifecycle';
import { platformQueryLifecycle } from './platform-lifecycle';

/** Compose once outside AccountDataProvider; never registers an Auth refresh listener. */
export function QueryLifecycleBoundary({ children }: { children: ReactNode }) {
  useEffect(() => attachQueryLifecycle(platformQueryLifecycle), []);
  return children;
}
