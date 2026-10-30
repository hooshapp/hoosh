import { Pressable, StyleSheet, Text } from 'react-native';
import { fonts } from '@/design/tokens';
export type AppleButtonProps = { disabled: boolean; onPress: () => void };
export function AppleButton({ disabled, onPress }: AppleButtonProps) {
  return <Pressable accessibilityRole="button" accessibilityLabel="Continue with Apple" disabled={disabled}
    accessibilityState={{ disabled }} onPress={onPress} style={[styles.button, disabled && styles.disabled]}>
    <Text style={styles.text}>Continue with Apple</Text>
  </Pressable>;
}
const styles = StyleSheet.create({
  button: { width: '100%', maxWidth: 244, minHeight: 48, marginTop: 16, borderRadius: 7, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  text: { fontFamily: fonts.bold, fontSize: 16, color: '#000000' }, disabled: { opacity: 0.55 },
});
