import { parseTime, formatTime } from './draft-utils';
import { useEffect, useRef, useState, type ComponentRef, type PropsWithChildren } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { DesignArtwork, type DesignAsset } from '@/components/ui/design-artwork';
import { InlineStatus } from '@/components/ui/inline-status';
import { Screen } from '@/components/ui/screen';
import { focusControl } from '@/components/ui/focus-control';
import { usePressGuard } from '@/components/ui/use-press-guard';
import { colors, fonts } from '@/design/tokens';
import { questeditorAssets as assets } from '@/design/questeditor-assets';

export type EditorState = 'ready' | 'saving' | 'error' | 'conflict' | 'unconfirmed' | 'unavailable';
export function Choice({ label, checked, onPress, disabled = false, radio = false, indicator, leading, compact = false }: {
  label: string; checked: boolean; onPress: () => void; disabled?: boolean; radio?: boolean;
  indicator?: DesignAsset; leading?: React.ReactNode; compact?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const press = usePressGuard(onPress, disabled);
  return <Pressable accessibilityRole={radio ? 'radio' : 'checkbox'} accessibilityLabel={label}
    accessibilityState={{ checked, disabled }} aria-checked={checked} disabled={disabled}
    onPress={press} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
    style={[editorStyles.choice, compact && editorStyles.compact, checked && editorStyles.selected, compact && checked && { backgroundColor: colors.action, borderColor: colors.action },
      focused && { outlineWidth: 2, outlineStyle: 'solid', outlineColor: colors.success, outlineOffset: 2 }]}>
    {leading}<Text style={[editorStyles.choiceLabel, compact && { textAlign: 'center' }]}>{label}</Text>
    {!compact ? <View style={[editorStyles.indicator, radio && { borderRadius: 11 }, checked && { backgroundColor: colors.readableSuccess, borderColor: colors.readableSuccess }]}>
      {checked && indicator ? <DesignArtwork asset={indicator} /> : null}
    </View> : null}
  </Pressable>;
}
export function EditorActions({ state, dirty, valid = true, onSave, onDiscard, saveLabel = 'Save changes' }: {
  state: EditorState; dirty: boolean; valid?: boolean; onSave?: () => void; onDiscard?: () => void; saveLabel?: string;
}) {
  const blocked = ['saving', 'unavailable', 'conflict', 'unconfirmed'].includes(state);
  const message = state === 'error' ? 'Changes couldn’t be saved. Your draft is still here.'
    : state === 'conflict' ? 'These settings changed elsewhere. Review the latest values before saving.'
    : state === 'unconfirmed' ? 'The save couldn’t be confirmed. Check the latest values before trying again.'
    : state === 'unavailable' || !onSave ? 'Saving isn’t available yet. Your changes haven’t been saved.' : null;
  return <View style={editorStyles.actions}>
    {message ? <InlineStatus state={state === 'error' || state === 'conflict' ? 'error' : 'unavailable'} message={message} /> : null}
    <Button label={saveLabel} disabled={!dirty || !valid || blocked || !onSave} busy={state === 'saving'} busyLabel="Saving…"
      onPress={() => onSave?.()} leadingVisual={<DesignArtwork asset={assets.check} />} style={editorStyles.save} labelStyle={editorStyles.saveText} />
    {dirty && onDiscard ? <Button label="Discard changes" variant="secondary" disabled={state === 'saving'} onPress={onDiscard} /> : null}
  </View>;
}
export function LeaveConfirmation({ onKeep, onDiscard }: { onKeep: () => void; onDiscard: () => void }) {
  const keep = useRef<ComponentRef<typeof Button>>(null);
  useEffect(() => { focusControl(keep.current); }, []);
  return <View style={editorStyles.panel}>
    <Text accessibilityRole="alert" style={editorStyles.body}>Discard unsaved changes?</Text>
    <Button ref={keep} label="Keep editing" onPress={onKeep} />
    <Button label="Discard and leave" variant="secondary" onPress={onDiscard} />
  </View>;
}
export function EditorPage({ title, subtitle, dirty = false, busy = false, onBack, children }: PropsWithChildren<{
  title: string; subtitle?: string; dirty?: boolean; busy?: boolean; onBack: () => void;
}>) {
  const [leaving, setLeaving] = useState(false);
  const back = useRef<ComponentRef<typeof Button>>(null);
  return <Screen title={title} header={null} contentStyle={editorStyles.page}>
    <View style={editorStyles.navigation}>
      <Button ref={back} label="" accessibilityLabel="Back" variant="secondary" disabled={busy}
        leadingVisual={<DesignArtwork asset={assets.back} />} style={editorStyles.back}
        onPress={() => dirty ? setLeaving(true) : onBack()} />
      <Text accessibilityRole="header" style={editorStyles.title}>{title}</Text>
    </View>
    {subtitle ? <Text style={editorStyles.body}>{subtitle}</Text> : null}
    {leaving ? <LeaveConfirmation onKeep={() => { setLeaving(false); focusControl(back.current); }} onDiscard={onBack} /> : null}
    {children}
  </Screen>;
}
export { weekdays, toggleItem, parseTime, formatTime } from './draft-utils';
export function TimeControl({ label, value, onChange, disabled = false }: { label: string; value: string; onChange: (value: string) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  return <View style={editorStyles.time}>
    <Text style={editorStyles.label}>{label}</Text>
    <Button label={formatTime(value)} accessibilityLabel={`${label}: ${formatTime(value)}`} variant="secondary"
      disabled={disabled} onPress={() => setOpen(!open)} style={editorStyles.timeButton} labelStyle={editorStyles.inputText}
      trailingVisual={<DesignArtwork asset={assets.time} />} />
    {open ? <Field label={`${label} (24-hour HH:MM)`} value={value} editable={!disabled} onChangeText={onChange}
      autoCapitalize="none" error={value && parseTime(value) === null ? 'Use a time such as 09:30 or 18:00.' : undefined} /> : null}
  </View>;
}
export const editorStyles = StyleSheet.create({
  page: { paddingHorizontal: 16, paddingTop: 4, gap: 16 },
  navigation: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { fontFamily: fonts.bold, fontSize: 25, lineHeight: 33, color: colors.darkNav, flex: 1 },
  back: { width: 44, minHeight: 44, borderRadius: 22, paddingHorizontal: 0, paddingVertical: 0, gap: 0 },
  body: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.muted },
  label: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 17, color: colors.muted },
  panel: { gap: 14 },
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10 },
  choice: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: 'white', borderWidth: 1, borderColor: colors.divider, borderRadius: 14 },
  selected: { backgroundColor: '#F0FAF4', borderColor: colors.readableSuccess },
  compact: { minWidth: 44, flexGrow: 1, paddingHorizontal: 4, backgroundColor: '#F0EBE0' },
  choiceLabel: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 20, color: colors.darkCanvas, flex: 1, flexShrink: 1 },
  indicator: { width: 22, height: 22, borderRadius: 6, borderWidth: 1, borderColor: colors.divider, alignItems: 'center', justifyContent: 'center' },
  actions: { gap: 12, marginTop: 4 },
  save: { borderRadius: 16, minHeight: 52 },
  saveText: { color: colors.onAction, fontSize: 16 },
  time: { flex: 1, minWidth: 120, gap: 6 },
  timeButton: { minHeight: 44, paddingHorizontal: 12, borderRadius: 16, justifyContent: 'space-between' },
  inputText: { fontFamily: fonts.medium, fontSize: 15, color: colors.darkNav, textAlign: 'left' },
});
