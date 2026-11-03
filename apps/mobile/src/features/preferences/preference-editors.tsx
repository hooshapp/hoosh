import { useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { DesignArtwork, type DesignAsset } from '@/components/ui/design-artwork';
import { EmptyCard } from '@/components/ui/empty-card';
import { InlineStatus } from '@/components/ui/inline-status';
import { preferenceAssets as assets } from '@/design/preference-assets';
import { colors, fonts } from '@/design/tokens';
import {
  Choice,
  EditorActions,
  EditorPage,
  editorStyles,
  toggleItem,
  type EditorState,
} from '@/features/editors/editor-controls';

export type PreferenceActions = {
  dirty: boolean;
  state?: EditorState;
  onSave?: () => void;
  onDiscard?: () => void;
};
export type SelectionOption = Readonly<{
  id: string;
  label: string;
  icon?: DesignAsset;
  background?: string;
}>;
function Heading({ children }: { children: string }) {
  return (
    <Text accessibilityRole="header" style={styles.heading}>
      {children}
    </Text>
  );
}
function SaveActions({
  label,
  valid = true,
  ...actions
}: PreferenceActions & { label: string; valid?: boolean }) {
  return (
    <EditorActions
      {...actions}
      state={actions.state ?? 'ready'}
      valid={valid}
      saveLabel={label}
      checkAsset={assets.save}
    />
  );
}
export function AgeEditor({
  value,
  options,
  onChange,
  onBack,
  ...actions
}: PreferenceActions & {
  value: number | null;
  options: readonly number[];
  onChange: (age: number | null) => void;
  onBack: () => void;
}) {
  const ages = [...new Set(options)].filter((age) => Number.isInteger(age) && age >= 0);
  return (
    <EditorPage
      variant="detail"
      backAsset={assets.back}
      title="Age"
      dirty={actions.dirty}
      busy={actions.state === 'saving'}
      onBack={onBack}>
      <Heading>How old are you?</Heading>
      {ages.length ? (
        <>
          <ScrollView
            style={styles.wheel}
            contentContainerStyle={styles.wheelValues}
            nestedScrollEnabled
            accessibilityLabel="Choose age">
            {ages.map((age) => (
              <Choice
                key={age}
                compact
                radio
                label={`${age}${value === age ? ' years old' : ''}`}
                checked={value === age}
                disabled={actions.state === 'saving'}
                onPress={() => onChange(age)}
                style={[styles.ageChoice, value === age && { backgroundColor: '#E6F7EF' }]}
                labelVisual={
                  <View
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      flexWrap: 'wrap',
                    }}>
                    <Text style={[styles.ageValue, value === age && styles.selectedAge]}>
                      {age}
                    </Text>
                    {value === age ? (
                      <Text
                        style={{
                          fontFamily: fonts.regular,
                          fontSize: 13,
                          color: colors.readableSuccess,
                        }}>
                        years old
                      </Text>
                    ) : null}
                  </View>
                }
                labelStyle={[styles.ageValue, value === age && styles.selectedAge]}
              />
            ))}
          </ScrollView>
          <View style={styles.guidance}>
            <DesignArtwork asset={assets.move} />
            <Text style={editorStyles.body}>Scroll up or down to choose</Text>
          </View>
          <Button
            label="Prefer not to say"
            variant="secondary"
            disabled={actions.state === 'saving'}
            onPress={() => onChange(null)}
          />
        </>
      ) : (
        <EmptyCard
          title="Age choices unavailable"
          description="You can continue without adding your age."
        />
      )}
      <SaveActions {...actions} label="Save age" valid={value === null || ages.includes(value)} />
    </EditorPage>
  );
}
export function GenderEditor({
  value,
  options,
  onChange,
  ...actions
}: PreferenceActions & {
  value: string | null;
  options: readonly SelectionOption[];
  onChange: (id: string | null) => void;
}) {
  return (
    <View style={editorStyles.panel}>
      {options.map((option) => (
        <Choice
          key={option.id}
          radio
          label={option.label}
          checked={value === option.id}
          indicator={assets.radio}
          disabled={actions.state === 'saving'}
          onPress={() => onChange(option.id)}
        />
      ))}
      <Button
        label="Prefer not to say"
        variant="secondary"
        disabled={actions.state === 'saving'}
        onPress={() => onChange(null)}
      />
      <SaveActions
        {...actions}
        label="Done"
        valid={value === null || options.some((option) => option.id === value)}
      />
    </View>
  );
}
export type ActivityDraft = Readonly<{
  selected: readonly string[];
  customSelected: boolean;
  custom: string;
}>;
export function ActivitiesEditor({
  draft,
  options,
  onChange,
  onBack,
  customError,
  feedback,
  navigationDirty,
  ...actions
}: PreferenceActions & {
  draft: ActivityDraft;
  options: readonly SelectionOption[];
  onChange: (draft: ActivityDraft) => void;
  onBack: () => void;
  customError?: string;
  feedback?: ReactNode;
  navigationDirty?: boolean;
}) {
  // Raw text goes to the server unchanged; JS trim differs from the adopted Unicode rules.
  const issue = draft.customSelected && draft.custom.length === 0;
  return (
    <EditorPage
      variant="detail"
      backAsset={assets.back}
      title="Redirect Me To"
      dirty={navigationDirty ?? actions.dirty}
      busy={actions.state === 'saving'}
      onBack={onBack}
    >
      <Heading>Less scrolling. More you.</Heading>
      {feedback}
      <View style={styles.options}>
        {options.map((option) => (
          <Choice
            key={option.id}
            label={option.label}
            checked={draft.selected.includes(option.id)}
            indicator={assets.checked}
            leading={option.icon ? <DesignArtwork asset={option.icon} /> : undefined}
            disabled={actions.state === 'saving'}
            onPress={() => onChange({ ...draft, selected: toggleItem(draft.selected, option.id) })}
          />
        ))}
        <View style={[styles.custom, draft.customSelected && styles.customSelected]}>
          <Choice
            label="Custom"
            checked={draft.customSelected}
            indicator={assets.checked}
            leading={<DesignArtwork asset={assets.custom} />}
            disabled={actions.state === 'saving'}
            onPress={() => onChange({ ...draft, customSelected: !draft.customSelected })}
          />
          {draft.customSelected ? (
            <View style={styles.customField}>
              <Field
                label="Custom activity"
                value={draft.custom}
                editable={actions.state !== 'saving'}
                onChangeText={(custom) => onChange({ ...draft, custom })}
                error={customError ?? (issue ? 'Enter an activity or deselect Custom.' : undefined)}
              />
            </View>
          ) : null}
        </View>
      </View>
      <SaveActions
        {...actions}
        label="Save activities"
        valid={!issue && draft.selected.every((id) => options.some((option) => option.id === id))}
      />
    </EditorPage>
  );
}
export type AppSelection =
  | {
      kind: 'catalog';
      options: readonly SelectionOption[];
      selected: readonly string[];
      sourceLabel: string;
      onChange: (ids: readonly string[]) => void;
    }
  | { kind: 'native'; summary: string | null; onChoose?: () => void };
export function AppsEditor({
  selection,
  onBack,
  ...actions
}: PreferenceActions & { selection: AppSelection; onBack: () => void }) {
  const [query, setQuery] = useState('');
  const selected = selection.kind === 'catalog' ? [...new Set(selection.selected)] : [];
  const options =
    selection.kind === 'catalog'
      ? selection.options.filter((option) =>
          option.label.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
        )
      : [];
  return (
    <EditorPage
      variant="detail"
      backAsset={assets.back}
      title="Distracting Apps"
      dirty={actions.dirty}
      busy={actions.state === 'saving'}
      onBack={onBack}>
      <Heading>Make room for focus</Heading>
      {selection.kind === 'native' ? (
        <>
          <Text style={editorStyles.body}>
            {selection.summary ?? 'No app selection is available yet.'}
          </Text>
          <Button
            label="Choose apps"
            variant="secondary"
            disabled={!selection.onChoose || actions.state === 'saving'}
            onPress={() => selection.onChoose?.()}
          />
          {!selection.onChoose ? (
            <InlineStatus
              state="unavailable"
              message="App selection isn’t available on this device yet."
            />
          ) : null}
        </>
      ) : (
        <>
          <Field
            label="Search apps"
            value={query}
            onChangeText={setQuery}
            editable={actions.state !== 'saving'}
            trailingVisual={<DesignArtwork asset={assets.search} />}
          />
          <Text style={styles.listHeading}>{selection.sourceLabel}</Text>
          <View style={styles.options}>
            {options.map((option) => (
              <Choice
                key={option.id}
                label={option.label}
                checked={selected.includes(option.id)}
                indicator={assets.checked}
                disabled={actions.state === 'saving'}
                leading={
                  option.icon ? (
                    <View
                      style={[
                        styles.appIdentity,
                        { backgroundColor: option.background ?? 'transparent' },
                      ]}>
                      <DesignArtwork asset={option.icon} />
                    </View>
                  ) : undefined
                }
                onPress={() => selection.onChange(toggleItem(selected, option.id))}
              />
            ))}
          </View>
          {!options.length ? (
            <EmptyCard
              title={selection.options.length ? 'No matching apps' : 'App list unavailable'}
              description={
                selection.options.length
                  ? 'Try a different search. Your selections are unchanged.'
                  : 'Choose apps when a supported selection method is available.'
              }
            />
          ) : null}
          <View style={styles.guidance}>
            <DesignArtwork asset={assets.summaryCheck} />
            <Text style={styles.summary}>
              {selected.length} apps selected for your current plan
            </Text>
          </View>
        </>
      )}
      <SaveActions
        {...actions}
        label={
          selection.kind === 'catalog'
            ? `Save ${selected.length} selected apps`
            : 'Save selected apps'
        }
        valid={
          selection.kind === 'catalog'
            ? selected.every((id) => selection.options.some((option) => option.id === id))
            : selection.summary !== null
        }
      />
    </EditorPage>
  );
}
const styles = StyleSheet.create({
  heading: {
    fontFamily: fonts.bold,
    fontSize: 28,
    lineHeight: 34,
    color: colors.darkCanvas,
    marginTop: 12,
    marginBottom: 6,
  },
  wheel: {
    maxHeight: 352,
    marginTop: 64,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 14,
    backgroundColor: colors.warmCard,
  },
  wheelValues: { padding: 18, gap: 2 },
  ageChoice: { minHeight: 48, backgroundColor: 'transparent', borderWidth: 0 },
  ageValue: {
    fontFamily: fonts.regular,
    fontSize: 28,
    lineHeight: 38,
    textAlign: 'center',
    color: colors.muted,
  },
  selectedAge: {
    fontFamily: fonts.bold,
    fontSize: 44,
    lineHeight: 54,
    color: colors.readableSuccess,
    backgroundColor: '#E6F7EF',
  },
  guidance: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  options: { gap: 8 },
  custom: { borderWidth: 1, borderColor: colors.divider, borderRadius: 14, overflow: 'hidden' },
  customSelected: { borderColor: colors.readableSuccess, backgroundColor: '#F0FAF4' },
  customField: { padding: 12 },
  listHeading: { fontFamily: fonts.bold, fontSize: 14, color: colors.darkCanvas },
  appIdentity: {
    width: 36,
    height: 36,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summary: { fontFamily: fonts.medium, fontSize: 12, color: colors.readableSuccess, flex: 1 },
});
