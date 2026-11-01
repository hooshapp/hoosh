import { useRef, type ComponentRef } from 'react';
import { Keyboard, Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/button';
import { focusControl } from '@/components/ui/focus-control';
import { useAnnouncement } from '@/components/ui/use-announcement';
import { colors, fonts } from '@/design/tokens';

/** A separate native window keeps confirmation reachable above IME/status/tab bars. */
export function ConfirmationDialog({
  title,
  keepLabel,
  discardLabel,
  onKeep,
  onDiscard,
  discardDisabled = false,
}: {
  title: string;
  keepLabel: string;
  discardLabel: string;
  onKeep: () => void;
  onDiscard: () => void;
  discardDisabled?: boolean;
}) {
  const keep = useRef<ComponentRef<typeof Button>>(null);
  useAnnouncement(title);
  return (
    <Modal
      testID="editor-confirmation"
      visible
      transparent
      animationType="none"
      onRequestClose={onKeep}
      onShow={() => {
        Keyboard.dismiss();
        focusControl(keep.current);
      }}>
      <SafeAreaProvider>
        <SafeAreaView style={styles.overlay}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <View accessibilityViewIsModal style={styles.card}>
              <Text
                accessibilityRole="alert"
                accessibilityLiveRegion="assertive"
                style={styles.title}>
                {title}
              </Text>
              <Button ref={keep} label={keepLabel} onPress={onKeep} />
              <Button
                label={discardLabel}
                variant="secondary"
                onPress={onDiscard}
                disabled={discardDisabled}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}
const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  card: { gap: 16, padding: 20, backgroundColor: colors.warmCanvas, borderRadius: 24, width: '100%', maxWidth: 480, alignSelf: 'center' },
  title: { fontFamily: fonts.bold, fontSize: 20, lineHeight: 28, color: colors.warmForeground },
});
