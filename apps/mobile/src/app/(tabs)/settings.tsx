import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { EmptyCard } from '@/components/ui/empty-card';
import { Screen } from '@/components/ui/screen';
import { colors, fonts } from '@/design/tokens';
import { useAuth } from '@/features/auth/auth-provider';
import { authErrorMessage } from '@/infrastructure/auth/errors';

export default function Settings() {
  const { controller, snapshot } = useAuth();
  const [notice, setNotice] = useState('');
  return (
    <Screen title="Settings" subtitle="Your account, activities, and plan.">
      <EmptyCard title="Account" description={snapshot.status === 'signed_in'
        ? `${snapshot.user.email ?? 'Email unavailable'}\n${snapshot.credentialStatus === 'ready' ? 'Signed in on this device.' : 'Session needs a connection check.'}`
        : 'No authenticated account.'} />
      <EmptyCard title="Development preview" description="Saved plans, API identity verification and native protection are not connected yet." />
      {notice ? <Text accessibilityRole="alert">{notice}</Text> : null}
      {snapshot.status === 'signed_in' && snapshot.credentialStatus !== 'ready' && <Pressable accessibilityRole="button" style={styles.button}
        onPress={() => { void controller.revalidateSession().catch(error => setNotice(authErrorMessage(error))); }}><Text style={styles.label}>Retry session</Text></Pressable>}
      <Pressable accessibilityRole="button" style={styles.button} onPress={() => {
        void controller.signOut().catch(error => setNotice(authErrorMessage(error)));
      }}><Text style={styles.label}>Sign out of this device</Text></Pressable>
    </Screen>
  );
}
const styles = StyleSheet.create({
  button: { minHeight: 48, borderRadius: 12, backgroundColor: colors.action, alignItems: 'center', justifyContent: 'center', padding: 12 },
  label: { fontFamily: fonts.bold, color: colors.onAction, fontSize: 16 },
});
