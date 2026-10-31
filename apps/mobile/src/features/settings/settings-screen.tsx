import type { PropsWithChildren, ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { DesignArtwork } from '@/components/ui/design-artwork';
import { InlineStatus } from '@/components/ui/inline-status';
import { Screen } from '@/components/ui/screen';
import { AccountHeader } from '@/features/account/account-header';
import {
  ProfileForm,
  type ProfileFormProps,
} from '@/features/account/profile-form';
import { settingsAssets } from '@/design/settings-assets';
import { colors, fonts } from '@/design/tokens';
import type { SettingsModel, SettingsField } from './settings-model';
import { SettingsRow } from './settings-row';

export type SettingsScreenProps = {
  model: SettingsModel;
  onEdit?: Partial<Record<SettingsField, () => void>>;
  onEditProfile?: () => void;
  onRetry?: () => void;
  /** Host owns draft/validation/persistence. Never instantiated with a fake session. */
  profileForm?: ProfileFormProps;
  inlineEditor?: { field: 'gender' | 'days' | 'hours' | 'sessions'; content: ReactNode };
};
export function SettingsScreen({
  model,
  onEdit = {},
  onEditProfile,
  onRetry,
  profileForm,
  inlineEditor,
}: SettingsScreenProps) {
  const values = [
    model.apps,
    model.activities,
    model.days,
    model.hours,
    model.sessions,
    ...Object.values(model.personalInfo ?? {}),
    ...Object.values(model.calendars ?? {}),
  ];
  const hasError = values.some((value) => value.state === 'error');
  const loading = values.some((value) => value.state === 'loading');
  return (
    <Screen
      title="Settings"
      header={null}
      testID="settings-scroll"
      contentStyle={styles.screen}
    >
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.title}>
          Settings
        </Text>
      </View>
      <AccountHeader
        identity={model.account?.identity ?? null}
        displayName={model.account?.displayName}
      />
      <View style={styles.divider} />
      <View style={styles.body}>
        {hasError ? (
          <InlineStatus
            state="error"
            message="Some settings couldn’t be loaded."
            onRetry={onRetry}
          />
        ) : loading ? (
          <InlineStatus state="loading" message="Loading settings…" />
        ) : null}
        {model.account && (profileForm || onEditProfile) ? (
          <Section title="Profile">
            {profileForm ? (
              <ProfileForm
                key={model.account.identity.user_id}
                {...profileForm}
              />
            ) : (
              <Button
                label="Edit display name"
                variant="secondary"
                onPress={() => onEditProfile?.()}
              />
            )}
          </Section>
        ) : null}
        {model.personalInfo ? (
          <Section title="Personal Info">
            <SettingsRow
              label="Age"
              value={model.personalInfo.age}
              icon={settingsAssets.user}
              iconID="settings-user"
              inline
              onPress={onEdit.age}
            />
            <SettingsRow
              label="Gender"
              value={model.personalInfo.gender}
              icon={settingsAssets.gender}
              iconID="settings-gender"
              inline
              onPress={onEdit.gender}
          inlineEditor={inlineEditor?.field === 'gender' ? inlineEditor.content : undefined}
            />
          </Section>
        ) : null}
        <Section title="Personalization">
          <SettingsRow
            label="Distracting Apps"
            value={model.apps}
            icon={settingsAssets.apps}
            iconID="settings-apps"
            onPress={onEdit.apps}
          />
          <SettingsRow
            label="Redirect Me To"
            value={model.activities}
            icon={settingsAssets.activities}
            iconID="settings-activities"
            onPress={onEdit.activities}
          />
        </Section>
        <Section title="My Plan">
          <SettingsRow
            label="Active Days"
            value={model.days}
            icon={settingsAssets.calendar}
            iconID="settings-calendar"
            onPress={onEdit.days}
          inlineEditor={inlineEditor?.field === 'days' ? inlineEditor.content : undefined}
          />
          <SettingsRow
            label="Active Hours"
            value={model.hours}
            icon={settingsAssets.clock}
            iconID="settings-clock"
            onPress={onEdit.hours}
          inlineEditor={inlineEditor?.field === 'hours' ? inlineEditor.content : undefined}
          />
          <View style={styles.sessionGroup}>
            <SettingsRow
              label="App Sessions"
              value={model.sessions}
              icon={settingsAssets.timer}
              iconID="settings-timer"
              green
              grouped
              onPress={onEdit.sessions}
          inlineEditor={inlineEditor?.field === 'sessions' ? inlineEditor.content : undefined}
            />
            <View style={styles.context}>
              <DesignArtwork
                asset={settingsAssets.info}
                testID="settings-info"
              />
              <Text style={styles.contextText}>
                These are your planned times to use distracting apps — not how
                long nudges run.
              </Text>
            </View>
          </View>
        </Section>
        {model.calendars ? (
          <Section title="Calendar Connections">
            <SettingsRow
              label="Connect Google Calendar"
              value={model.calendars.googleCalendar}
              icon={settingsAssets.calendar}
              iconID="settings-calendar"
              onPress={onEdit.googleCalendar}
            />
            <SettingsRow
              label="Connect Apple Calendar"
              value={model.calendars.appleCalendar}
              icon={settingsAssets.calendar}
              iconID="settings-calendar"
              onPress={onEdit.appleCalendar}
            />
          </Section>
        ) : null}
      </View>
    </Screen>
  );
}
function Section({ title, children }: PropsWithChildren<{ title: string }>) {
  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={styles.sectionTitle}>
        {title}
      </Text>
      {children}
    </View>
  );
}
const styles = StyleSheet.create({
  screen: { paddingHorizontal: 0, paddingTop: 0, gap: 0 },
  header: { minHeight: 52, paddingHorizontal: 16, justifyContent: 'center' },
  title: {
    fontFamily: fonts.bold,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.3,
    color: colors.darkCanvas,
  },
  divider: { height: 1, backgroundColor: colors.divider },
  body: { paddingHorizontal: 20, paddingTop: 24, gap: 28 },
  section: { gap: 10 },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  sessionGroup: {
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 14,
    overflow: 'hidden',
  },
  context: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0FAF4',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  contextText: {
    flex: 1,
    minWidth: 0,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.darkCanvas,
  },
});
