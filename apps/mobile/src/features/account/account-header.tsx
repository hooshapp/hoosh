import type { AuthIdentity, Personalization } from '@disconnect/contracts';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/design/tokens';

import femaleAvatar from '../../../assets/onboarding/gender-female.svg';
import maleAvatar from '../../../assets/onboarding/gender-male.svg';
import otherAvatar from '../../../assets/onboarding/gender-other.svg';
import neutralAvatar from '../../../assets/onboarding/permission/dinosaur.svg';

const avatars = { Female: femaleAvatar, Male: maleAvatar, Other: otherAvatar, neutral: neutralAvatar };

export function AccountHeader({
  identity,
  displayName,
  avatarGender,
  onEdit,
  editing = false,
  editDisabled = false,
}: {
  identity: AuthIdentity | null;
  onEdit?: () => void;
  editing?: boolean;
  editDisabled?: boolean;
  /** Validated profile name from the owning feature; never inferred from email. */
  displayName?: string | null;
  avatarGender?: Personalization['gender'];
}) {
  const variant = avatarGender ?? 'neutral';
  const [failedVariant, setFailedVariant] = useState<keyof typeof avatars>();
  const content = (
    <View style={styles.card}>
      <View
        style={styles.avatar}
        accessible={false}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        aria-hidden>
        {failedVariant !== variant ? (
          <Image
            source={avatars[variant]}
            recyclingKey={variant}
            testID="settings-avatar"
            style={styles.image}
            contentFit="contain"
            accessible={false}
            onError={() => setFailedVariant(variant)}
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
  return onEdit ? <Pressable accessibilityRole="button" accessibilityLabel={editing ? 'Close profile editor' : 'Edit profile'} accessibilityState={{ disabled: editDisabled, expanded: editing }} disabled={editDisabled} onPress={onEdit}>{content}</Pressable> : content;
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
