import { requireOptionalNativeModule } from 'expo';
import { useEffect, useRef, useState } from 'react';
import { Text } from 'react-native';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';

type ProbeModule = { probe(minutes: number): Promise<unknown> };
/** Developer-only bounded observations, never usage/savings metrics or account data. */
export function UsageProbe() {
  const module = requireOptionalNativeModule<ProbeModule>('HooshUsage');
  const [result, setResult] = useState('No observation yet.');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  return (
    <Screen title="Android capability probe">
      <Text>
        RN08_ANDROID_PROBE_ONLY — Real device observation. No app identities leave the module. No
        restrictions are installed.
      </Text>
      <Text>
        {module
          ? 'Native module connected'
          : 'Native module absent — use an Android development build.'}
      </Text>
      <Button
        label="Read bounded usage probe"
        busy={busy}
        disabled={!module}
        onPress={() => {
          if (!module || lock.current) return;
          lock.current = true;
          setBusy(true);
          void module
            .probe(1)
            .then(
              (value) => {
                if (mounted.current) setResult(JSON.stringify(value));
              },
              () => {
                if (mounted.current) setResult('Probe unavailable.');
              },
            )
            .finally(() => {
              lock.current = false;
              if (mounted.current) setBusy(false);
            });
        }}
      />
      <Text accessibilityLiveRegion="polite">{result}</Text>
    </Screen>
  );
}
