import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { DesignArtwork } from '@/components/ui/design-artwork';
import { questAssets } from '@/design/quest-assets';
import { colors, fonts } from '@/design/tokens';
import type { QuestSuggestion } from './quests-model';

export function QuestCard({
  suggestion,
  onAccept,
  onPersonalize,
  busy = false,
  stacked,
}: {
  suggestion: QuestSuggestion;
  onAccept?: (id: string) => void;
  onPersonalize?: (id: string) => void;
  busy?: boolean;
  stacked: boolean;
}) {
  return (
    <View style={styles.card} testID={`quest-card-${suggestion.id}`}>
      <View style={styles.header}>
        <View
          style={[
            styles.badge,
            {
              backgroundColor:
                suggestion.accent === 'green' ? colors.readableSuccess : colors.darkNav,
            },
          ]}>
          <Text
            style={[
              styles.badgeLabel,
              { color: suggestion.accent === 'green' ? colors.white : colors.warmHeader },
            ]}>
            {suggestion.categoryLabel}
          </Text>
        </View>
        <Text style={styles.context}>{suggestion.context}</Text>
      </View>
      <View style={styles.body}>
        <Text accessibilityRole="header" style={styles.title}>
          {suggestion.title}
        </Text>
        <View style={styles.chips}>
          {suggestion.scheduleLabels.map((label, index) => (
            <View key={`${index}-${label}`} style={styles.chip}>
              <Text style={styles.chipLabel}>{label}</Text>
            </View>
          ))}
        </View>
        {suggestion.restrictionNotice ? (
          <Text style={styles.notice}>{suggestion.restrictionNotice}</Text>
        ) : null}
        <View style={[styles.actions, stacked && styles.stacked]}>
          <Button
            label="Personalize"
            accessibilityLabel={`Personalize ${suggestion.title}`}
            variant="secondary"
            busy={busy}
            busyLabel="Working…"
            disabled={!onPersonalize}
            leadingVisual={<DesignArtwork asset={questAssets.pencil} testID="quest-pencil" />}
            style={styles.personalize}
            labelStyle={[styles.actionLabel, styles.personalizeLabel]}
            onPress={() => onPersonalize?.(suggestion.id)}
          />
          <Button
            label="Accept"
            accessibilityLabel={`Accept ${suggestion.title}`}
            busy={busy}
            busyLabel="Working…"
            disabled={!onAccept}
            leadingVisual={
              <View style={styles.checkSlot}>
                <DesignArtwork asset={questAssets.check} testID="quest-check" />
              </View>
            }
            style={styles.accept}
            labelStyle={styles.actionLabel}
            onPress={() => onAccept?.(suggestion.id)}
          />
        </View>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  card: {
    borderWidth: 1.5,
    borderColor: colors.warmOutline,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: colors.warmCard,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 14.5,
    paddingVertical: 8,
    backgroundColor: colors.warmHeader,
  },
  badge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  badgeLabel: { fontFamily: fonts.bold, fontSize: 10, lineHeight: 12 },
  context: {
    flex: 1,
    minWidth: 120,
    fontFamily: fonts.bold,
    fontSize: 12,
    lineHeight: 16,
    color: colors.warmForeground,
  },
  body: { paddingHorizontal: 14.5, paddingVertical: 12, gap: 7 },
  title: { fontFamily: fonts.bold, fontSize: 17, lineHeight: 22, color: colors.fieldForeground },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    borderRadius: 10,
    backgroundColor: '#F0EBE0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    maxWidth: '100%',
  },
  chipLabel: { fontFamily: fonts.bold, fontSize: 11, lineHeight: 14, color: colors.warmForeground },
  notice: { fontFamily: fonts.regular, fontSize: 10, lineHeight: 13, color: '#8B5E00' },
  actions: { flexDirection: 'row', gap: 10 },
  stacked: { flexDirection: 'column' },
  personalize: {
    flex: 1,
    minWidth: 0,
    minHeight: 44,
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 10,
    backgroundColor: '#F0EBE0',
  },
  accept: {
    flex: 1,
    minWidth: 0,
    minHeight: 44,
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  actionLabel: { fontSize: 14, lineHeight: 20, color: colors.onAction },
  personalizeLabel: { color: '#555555' },
  checkSlot: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
});
