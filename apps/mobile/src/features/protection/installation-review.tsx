import { useEffect, useState } from 'react';
import { Alert, AppState, Platform, Text } from 'react-native';
import { Button } from '@/components/ui/button';
import { InlineStatus } from '@/components/ui/inline-status';
import type { InstallationReview } from '@/infrastructure/native/native-owner-session';
import { useNativeInstallation } from './native-owner-boundary';

export function InstallationReviewPanel() {
  const session = useNativeInstallation();
  return Platform.OS === 'ios' && session ? <ConnectedReview key="installation" session={session} /> : null;
}
function ConnectedReview({ session }: { session: NonNullable<ReturnType<typeof useNativeInstallation>> }) {
  const [read, setRead] = useState<{ session: typeof session; value: InstallationReview }>();
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let alive = true;
    void session.read().then(value => { if (alive) setRead({ session, value }); })
      .catch(() => { if (alive) setError(true); });
    return () => { alive = false; };
  }, [session]);
  const value = read?.session === session ? read.value : undefined;
  const review = value && value.status !== 'owned' && value.status !== 'unclaimed';
  async function claim() {
    if (!value || busy || AppState.currentState !== 'active') return;
    setBusy(true); setError(false);
    try {
      await session.claim(value.revision);
      setRead({ session, value: await session.read() });
    } catch {
      setError(true);
      // A failed Stop or lost acknowledgment may have left a durable pending claim.
      // Refresh its revision so the user can explicitly retry without resetting data.
      try { setRead({ session, value: await session.read() }); } catch { /* Preserve error. */ }
    } finally { setBusy(false); }
  }
  function confirm() {
    Alert.alert('Review Screen Time setup',
      'This will stop existing Hoosh protection on this device and prepare setup for your current account. You will need to select apps and enable protection again. Previous account history will stay private.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Stop and reconfigure', style: 'destructive', onPress: () => { void claim(); } },
      ]);
  }
  return <>
    {review && <InlineStatus state="unavailable" message="This device has an existing Hoosh Screen Time setup. Review it before configuring protection for this account." />}
    {value?.status === 'owned' && <Text>Device setup is assigned to this account. Review Screen Time access and saved apps below.</Text>}
    {error && <InlineStatus state="error" message="Screen Time setup could not be verified. Existing data has been kept. Try again." />}
    {(review || value?.status === 'unclaimed') && <Button label={review ? 'Review existing setup' : 'Prepare device setup'} busy={busy} onPress={confirm} />}
    {error && !value && <Button label="Retry device review" onPress={async () => {
      setError(false);
      try { setRead({ session, value: await session.read() }); } catch { setError(true); }
    }} />}
  </>;
}
