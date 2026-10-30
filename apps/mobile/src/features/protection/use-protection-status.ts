import type { ProtectionIntegration } from '@disconnect/contracts';
import { useEffect, useMemo, useReducer, useState } from 'react';

import { mapProtectionStatus, type ProtectionRead } from './status-model';

export const PROTECTION_READ_TIMEOUT_MS = 10_000;
type ReadKey = {
  integration: ProtectionIntegration;
  desiredRevision: number | null;
  refresh: number;
  visible: boolean;
};
type ReadTicket = { key: ReadKey; read: ProtectionRead };

/** Read-only consumer. Host passes visibility (foreground AND route focus) and refreshes after setup. */
export function useProtectionStatus(
  integration: ProtectionIntegration,
  desiredRevision: number | null,
  visible: boolean,
) {
  const [refresh, requestRefresh] = useReducer((value: number) => value + 1, 0);
  const [ticket, setTicket] = useState<ReadTicket>();
  // A changed visibility cycle cannot expose an earlier ready result before effects run.
  const key = useMemo(
    () => ({ integration, desiredRevision, refresh, visible }),
    [integration, desiredRevision, refresh, visible],
  );
  useEffect(() => {
    if (!visible || integration.availability !== 'connected') return;
    let current = true;
    const deadline = Date.now() + PROTECTION_READ_TIMEOUT_MS;
    const update = (read: ProtectionRead) => {
      if (current) setTicket({ key, read });
    };
    const timeout = setTimeout(() => {
      update({ phase: 'error' });
      current = false;
    }, PROTECTION_READ_TIMEOUT_MS);
    // No writes or prompts. Promise handlers suppress late/uncancellable native results.
    const invoke = <T>(operation: () => Promise<T>) =>
      Promise.resolve().then(() => {
        if (!current) throw new Error('Status read stopped.');
        return operation();
      });
    void Promise.all([
      invoke(() => integration.service.getCapabilities()),
      invoke(() => integration.service.getAuthorization()),
      invoke(() => integration.service.getStatus()),
    ]).then(
      ([capabilities, authorization, status]) => {
        clearTimeout(timeout);
        if (Date.now() >= deadline) {
          update({ phase: 'error' });
          current = false;
          return;
        }
        update({ phase: 'ready', capabilities, authorization, status });
      },
      () => {
        clearTimeout(timeout);
        update({ phase: 'error' });
      },
    );
    return () => {
      current = false;
      clearTimeout(timeout);
    };
  }, [key, integration, desiredRevision, refresh, visible]);
  const read: ProtectionRead = !visible
    ? { phase: 'stale' }
    : ticket?.key === key
      ? ticket.read
      : { phase: 'checking' };
  return {
    model: mapProtectionStatus(integration, desiredRevision, read),
    refresh: requestRefresh,
  };
}
