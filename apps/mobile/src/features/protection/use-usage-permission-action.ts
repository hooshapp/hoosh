import type { ProtectionIntegration } from '@disconnect/contracts';
import { useEffect, useRef, useState } from 'react';

/** Native permission launch only. Stale/unmounted actions cannot refresh a replacement owner. */
export function useUsagePermissionAction(integration: ProtectionIntegration, refresh: () => void) {
  const [ticket, setTicket] = useState<{
    owner: ProtectionIntegration;
    id: number;
    busy: boolean;
    failed: boolean;
  }>();
  const sequence = useRef(0);
  const lock = useRef<{ owner: ProtectionIntegration; id: number } | undefined>(undefined);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      sequence.current++;
    };
  }, []);
  useEffect(() => {
    sequence.current++;
    lock.current = undefined;
    return () => {
      sequence.current++;
    };
  }, [integration]);
  return {
    busy: ticket?.owner === integration && ticket.busy,
    failed: ticket?.owner === integration && ticket.failed,
    run: () => {
      if (integration.availability !== 'connected' || lock.current?.owner === integration) return;
      const id = ++sequence.current;
      lock.current = { owner: integration, id };
      setTicket({ owner: integration, id, busy: true, failed: false });
      void integration.service
        .requestAuthorization()
        .then(
          () => {
            if (mounted.current && sequence.current === id) refresh();
          },
          () => {
            if (mounted.current)
              setTicket((current) =>
                current?.owner === integration && current.id === id
                  ? { ...current, failed: true }
                  : current,
              );
          },
        )
        .finally(() => {
          if (lock.current?.id === id) lock.current = undefined;
          if (mounted.current)
            setTicket((current) =>
              current?.owner === integration && current.id === id
                ? { ...current, busy: false }
                : current,
            );
        });
    },
  };
}
