import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '@/design/tokens';

export function AuthGate({ signingOut = false }: { signingOut?: boolean }) {
  return <View style={styles.screen} accessibilityLiveRegion="polite">
    <ActivityIndicator color={colors.action} />
    <Text style={styles.text}>{signingOut ? 'Signing out…' : 'Checking your session…'}</Text>
  </View>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.darkCanvas, gap: 16 },
  text: { fontFamily: fonts.regular, fontSize: 16, color: colors.white },
});
