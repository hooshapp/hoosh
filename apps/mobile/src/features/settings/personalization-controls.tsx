import { useEffect } from 'react';
import type { Personalization } from '@disconnect/contracts';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { colors, fonts } from '@/design/tokens';
import type { usePersonalization } from './use-personalization';

export const tones = [
  ['Supportive', 'Warm and encouraging'], ['Direct', 'Clear and no-nonsense'],
  ['Playful', 'Light and witty'], ['Intense', 'High pressure accountability'],
] as const;
export function PersonalizationControls({ editor, field, onDone }: {
  editor: ReturnType<typeof usePersonalization>; field: 'gender' | 'nudge_tone'; onDone(): void;
}) {
  useEffect(() => { if (editor.saved) onDone(); }, [editor.saved, onDone]);
  const form = editor.form;
  const choices = field === 'gender' ? [['Male', ''], ['Female', ''], ['Other', '']] as const : tones;
  const disabled = !form || !['ready', 'error'].includes(form.state);
  return <View style={s.body}>
    {choices.map(([label, detail]) => <Pressable key={label} accessibilityRole="radio" accessibilityLabel={label}
      accessibilityState={{ checked: form?.draft[field] === label, selected: form?.draft[field] === label, disabled }} disabled={disabled}
      style={[s.choice, form?.draft[field] === label && s.selected]}
      onPress={() => form?.onChange({ ...form.draft, [field]: label } as Personalization)}>
      <View style={s.copy}><Text style={s.label}>{label}</Text>{detail ? <Text style={s.detail}>{detail}</Text> : null}</View>
      <View style={[s.radio, form?.draft[field] === label && s.radioSelected]} />
    </Pressable>)}
    {editor.saved ? <Text accessibilityLiveRegion="polite" style={s.detail}>Preferences saved.</Text> : null}
    {editor.needsReview ? <><Text style={s.detail}>Check your latest preferences before saving again.</Text>
      <Button label="Check latest preferences" onPress={() => { void editor.checkLatest(); }} busy={editor.reviewing} />
      {editor.review ? <><Button label="Keep my changes" onPress={() => editor.resolveReview(true)} /><Button label="Use latest preferences" onPress={() => editor.resolveReview(false)} /></> : null}</> : null}
    {form?.state === 'error' ? <Text accessibilityRole="alert" style={s.detail}>Could not save. Your choices are still here.</Text> : null}
    <Button label="Done" busy={form?.state === 'saving'} disabled={disabled || editor.needsReview}
      onPress={() => { if (form?.dirty) form.onSave(); else onDone(); }} />
  </View>;
}
const s = StyleSheet.create({
  body: { gap: 8 }, choice: { minHeight: 44, padding: 12, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 12 },
  selected: { backgroundColor: '#F0FAF4' }, copy: { flex: 1 }, label: { fontFamily: fonts.medium, fontSize: 14, color: colors.darkCanvas },
  detail: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted, marginTop: 3 }, radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 1, borderColor: colors.warmOutline },
  radioSelected: { borderWidth: 6, borderColor: colors.success },
});
