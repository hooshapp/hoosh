import { useState } from 'react';
import { usePreventRemove } from 'expo-router/react-navigation';
import { LeaveConfirmation } from './editor-controls';
/** Public Router removal/unload guard. Local Back confirmation is owned by EditorPage. */
export function useRouteDraftGuard(dirty: boolean) {
  const [pending, setPending] = useState<(() => void) | null>(null);
  const [allowed, setAllowed] = useState(false);
  const disable = usePreventRemove(dirty && !allowed, ({ repeat }) => setPending(() => repeat));
  return {
    confirmation: pending ? <LeaveConfirmation onKeep={() => setPending(null)} onDiscard={() => { setAllowed(true); pending(); }} /> : null,
    exit: (navigate: () => void) => { setAllowed(true); disable(); navigate(); },
  };
}
