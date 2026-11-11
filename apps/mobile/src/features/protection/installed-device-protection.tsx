import { focusManager } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useIsFocused } from 'expo-router';
import { Button } from '@/components/ui/button';
import { createInterventionProtectionReader } from '@/infrastructure/native/intervention-protection-reader';
import type { NativeOwner } from './native-owner-boundary';
import { mapProtectionStatus, type ProtectionRead } from './status-model';
import { ProtectionStatus } from './protection-status';

/** Reads installed native reasons, including quests; API outage does not hide local Stop/status. */
export function InstalledDeviceProtection({ owner }: { owner: NativeOwner }) {
  const focused = useIsFocused();
  const reader = useMemo(
    () => createInterventionProtectionReader(owner.owner, owner.port),
    [owner],
  );
  const [reload, setReload] = useState(0),
    [opening, setOpening] = useState(false);
  const key = useMemo(
    () => ({ reader, focused, reload }),
    [reader, focused, reload],
  );
  const [ticket, setTicket] = useState<{
    key: typeof key;
    value: ProtectionRead;
  }>();
  useEffect(() => () => reader.dispose(), [reader]);
  useEffect(() => {
    if (!focused) return;
    let alive = true,
      pending = false,
      serial = 0;
    const update = (value: ProtectionRead) => {
      if (alive) setTicket({ key, value });
    };
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const refresh = () => {
      if (!focusManager.isFocused() || pending || !alive) return;
      pending = true;
      const run = ++serial;
      timeout = setTimeout(() => {
        serial++;
        pending = false;
        update({ phase: 'error' });
      }, 10000);
      void reader
        .read()
        .then(
          (next) => {
            if (run === serial) update(next);
          },
          () => {
            if (run === serial) update({ phase: 'error' });
          },
        )
        .finally(() => {
          if (run === serial) {
            clearTimeout(timeout);
            pending = false;
          }
        });
    };
    refresh();
    const detach = focusManager.subscribe((active) => {
      if (active) refresh();
      else {
        serial++;
        pending = false;
        clearTimeout(timeout);
        update({ phase: 'stale' });
      }
    });
    const interval = setInterval(refresh, 5000);
    return () => {
      alive = false;
      clearTimeout(timeout);
      clearInterval(interval);
      detach();
    };
  }, [reader, focused, key]);
  const read: ProtectionRead = !focused
    ? { phase: 'stale' }
    : ticket?.key === key
      ? ticket.value
      : { phase: 'checking' };
  // This card describes the installed device revision, not agreement with a desired API plan.
  const model =
    read.phase === 'ready' &&
    read.status.state === 'inactive' &&
    read.status.installedRevision !== null &&
    read.status.installedReasonIds.length > 0
      ? {
          kind: 'inactive' as const,
          title: 'Protection scheduled',
          message:
            'Installed rules will run at their saved times. No intervention is active right now.',
          tone: 'neutral' as const,
        }
      : mapProtectionStatus(
          { availability: 'connected', platform: 'android' },
          read.phase === 'ready' ? read.status.installedRevision : null,
          read,
        );
  const refresh = () => setReload((v) => v + 1);
  return (
    <View style={{ gap: 12 }}>
      <ProtectionStatus model={model} onRetry={refresh} />
      <Text>
        Device status comes from installed local rules. A saved account schedule
        does not install protection automatically.
      </Text>
      <Button
        label="Check installed protection"
        disabled={opening}
        onPress={refresh}
      />
      <Button
        label="Review app protection access"
        busy={opening}
        onPress={() => {
          setOpening(true);
          void owner.port
            .interventionReviewAccess()
            .catch(() => {})
            .finally(() => {
              setOpening(false);
              refresh();
            });
        }}
      />
    </View>
  );
}
