import type { AuthIdentity } from '@disconnect/contracts';
import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/design/tokens';

import avatar from '../../../assets/account/settings-avatar.svg';

/** Figma 10562:136. Decorative brand artwork, never a gender/mood/health assertion. */
export function AccountHeader({
  identity,
  displayName,
}: {
  identity: AuthIdentity | null;
  /** Validated profile name from the owning feature; never inferred from email. */
  displayName?: string | null;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  return (
    <View style={styles.card}>
      <View
        style={styles.avatar}
        accessible={false}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        aria-hidden>
        {!imageFailed ? (
          <Image
            source={avatar}
            testID="settings-avatar"
            style={styles.image}
            contentFit="contain"
            accessible={false}
            onError={() => setImageFailed(true)}
          />
        ) : null}
      </View>
      <View style={styles.info}>
        <Text accessibilityRole="header" style={styles.title}>
          {identity ? displayName ?? 'Your account' : 'Your account'}
        </Text>
        <View style={styles.emailRow}>
          <Text selectable style={styles.email}>
            {identity ? identity.email ?? 'Signed-in account' : 'Account details aren’t available yet.'}
          </Text>
        </View>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 16 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#8B5E00',
    backgroundColor: colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: { width: 52, height: 52 },
  info: { flex: 1, minWidth: 0, gap: 4 },
  title: { fontFamily: fonts.bold, fontSize: 20, letterSpacing: -0.4, color: colors.darkCanvas },
  emailRow: { minHeight: 44, justifyContent: 'center' },
  email: { fontFamily: fonts.medium, fontSize: 13, color: colors.darkCanvas, flexShrink: 1 },
});
