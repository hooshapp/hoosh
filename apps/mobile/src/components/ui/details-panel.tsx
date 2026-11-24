import { useState, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from './button';
import { colors, fonts } from '@/design/tokens';

/** Secondary controls stay mounted after opening, preserving pending actions and drafts. */
export function DetailsPanel({ title, description, children, initiallyOpen = false }: {
  title: string; description?: string; children: ReactNode; initiallyOpen?: boolean;
}) {
  const [open, setOpen] = useState(initiallyOpen);
  const [visited, setVisited] = useState(initiallyOpen);
  return <View style={styles.panel}>
    <Button label={title} accessibilityLabel={title} accessibilityHint={description} description={description} expanded={open} variant="secondary"
      trailingVisual={<Text style={styles.chevron} accessible={false}>{open ? '−' : '+'}</Text>}
      style={styles.trigger} onPress={() => { setVisited(true); setOpen(value => !value); }} />
    {visited ? <View style={[styles.body, !open && styles.hidden]} accessibilityElementsHidden={!open}
      importantForAccessibility={open ? 'auto' : 'no-hide-descendants'} aria-hidden={!open}>
      {children}
    </View> : null}
  </View>;
}
const styles = StyleSheet.create({
  panel: { gap: 0, borderWidth: 1, borderColor: colors.warmOutline, borderRadius: 14, backgroundColor: colors.warmCard, overflow: 'hidden' },
  trigger: { borderWidth: 0, borderRadius: 0, backgroundColor: 'transparent', minHeight: 56 },
  body: { padding: 16, gap: 12 }, hidden: { display: 'none' },
  chevron: { fontFamily: fonts.medium, fontSize: 20, color: colors.muted },
});
