import { useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { Button } from '@/components/ui/button';
import { EmptyCard } from '@/components/ui/empty-card';
import { InlineStatus } from '@/components/ui/inline-status';
import { Screen } from '@/components/ui/screen';
import { colors, fonts } from '@/design/tokens';
import { QuestCard } from './quest-card';
import type { QuestsModel } from './quests-model';

export type QuestsScreenProps = {
  model: QuestsModel;
  onAccept?: (id: string) => void;
  onPersonalize?: (id: string) => void;
  onCreate?: () => void;
  onRetry?: () => void;
  busy?: boolean;
};
/** Suggestions never become saved occurrences through presentation state. */
export function QuestsScreen({
  model,
  onAccept,
  onPersonalize,
  onCreate,
  onRetry,
  busy = false,
}: QuestsScreenProps) {
  const [width, setWidth] = useState<number>();
  const { fontScale } = useWindowDimensions();
  const stacked = (width !== undefined && width < 300) || fontScale > 1.3;
  return (
    <Screen
      title="Your Quests"
      contentStyle={styles.screen}
      testID="quests-scroll"
      header={
        <View style={styles.heading}>
          <Text accessibilityRole="header" style={styles.title}>
            Your Quests
          </Text>
          <Text style={styles.subtitle}>
            {model.interestSummary
              ? 'Based on your interests & schedule'
              : 'Make time for the things you choose.'}
          </Text>
        </View>
      }>
      <View
        testID="quests-content"
        onLayout={({ nativeEvent }) => setWidth(Math.ceil(nativeEvent.layout.width))}>
        <Text style={styles.summary}>{model.interestSummary ?? 'Suggested quests'}</Text>
        <View style={styles.cards}>
          {model.suggestions.state === 'ready' ? (
            model.suggestions.items.length ? (
              model.suggestions.items.map((item) => (
                <QuestCard
                  key={item.id}
                  suggestion={item}
                  onAccept={onAccept}
                  onPersonalize={onPersonalize}
                  busy={busy}
                  stacked={stacked}
                />
              ))
            ) : (
              <EmptyCard
                title="No suggestions right now"
                description="Check back another time for a little inspiration."
              />
            )
          ) : (
            <SuggestionStatus state={model.suggestions.state} onRetry={onRetry} busy={busy} />
          )}
        </View>
        <Button
          label="Create a custom quest"
          description="Set your own activity, time & frequency"
          accessibilityLabel="Create a custom quest"
          variant="secondary"
          disabled={!onCreate}
          busy={busy}
          busyLabel="Working…"
          onPress={() => onCreate?.()}
          leadingVisual={
            <View style={styles.plus}>
              <Text style={styles.plusLabel}>+</Text>
            </View>
          }
          trailingVisual={<Text style={styles.chevron}>›</Text>}
          style={styles.create}
          labelStyle={styles.createLabel}
        />
        {model.saved.state === 'ready' ? (
          model.saved.items.length ? (
            <View style={styles.saved}>
              <Text accessibilityRole="header" style={styles.savedHeading}>
                Saved quests
              </Text>
              {model.saved.items.map((item) => (
                <EmptyCard
                  key={item.id}
                  title={item.title}
                  description={`${item.scheduleLabel} · ${item.statusLabel}`}
                />
              ))}
            </View>
          ) : null
        ) : (
          <View style={styles.saved}>
            <InlineStatus
              state={
                model.saved.state === 'loading'
                  ? 'loading'
                  : model.saved.state === 'error'
                    ? 'error'
                    : 'unavailable'
              }
              message={
                model.saved.state === 'loading'
                  ? 'Loading saved quests…'
                  : model.saved.state === 'error'
                    ? 'Saved quests couldn’t be loaded.'
                    : 'Saved quests aren’t available yet.'
              }
            />
          </View>
        )}
      </View>
    </Screen>
  );
}
function SuggestionStatus({
  state,
  onRetry,
  busy,
}: {
  state: 'loading' | 'error' | 'unavailable';
  onRetry?: () => void;
  busy: boolean;
}) {
  if (state === 'loading') return <InlineStatus state="loading" message="Loading suggestions…" />;
  return (
    <InlineStatus
      state={state}
      message={
        state === 'error' ? 'Suggestions couldn’t be loaded.' : 'Suggestions aren’t available yet.'
      }
      onRetry={state === 'error' ? onRetry : undefined}
      retrying={busy}
    />
  );
}
const styles = StyleSheet.create({
  screen: { paddingHorizontal: 16, paddingTop: 2, gap: 12 },
  heading: { marginHorizontal: 8, gap: 4 },
  title: { fontFamily: fonts.bold, fontSize: 26, lineHeight: 34, color: colors.warmForeground },
  subtitle: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 17, color: colors.muted },
  summary: {
    marginHorizontal: 8,
    marginBottom: 18,
    fontFamily: fonts.bold,
    fontSize: 11,
    lineHeight: 14,
    color: '#7A4A00',
  },
  cards: { gap: 16 },
  create: {
    marginTop: 18,
    minHeight: 66,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.warmHeader,
    backgroundColor: colors.warmCanvas,
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 10,
  },
  createLabel: { fontSize: 14, lineHeight: 18, color: colors.darkCanvas, textAlign: 'left' },
  plus: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.warmHeader,
  },
  plusLabel: { fontFamily: fonts.regular, fontSize: 20, color: colors.darkCanvas },
  chevron: { fontFamily: fonts.regular, fontSize: 18, color: colors.readableSuccess },
  saved: { marginTop: 18, gap: 12 },
  savedHeading: { fontFamily: fonts.bold, fontSize: 19, color: colors.warmForeground },
});
