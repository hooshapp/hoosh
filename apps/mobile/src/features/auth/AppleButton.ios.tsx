import * as Apple from 'expo-apple-authentication';
import { View } from 'react-native';
import type { AppleButtonProps } from './AppleButton';
export function AppleButton({ disabled, onPress }: AppleButtonProps) {
  // The official system button supplies Apple's localized mark and typography.
  return <View style={{ width: '100%', maxWidth: 244, marginTop: 16, opacity: disabled ? 0.55 : 1 }}
    pointerEvents={disabled ? 'none' : 'auto'} accessibilityElementsHidden={disabled} importantForAccessibility={disabled ? 'no-hide-descendants' : 'auto'}>
    <Apple.AppleAuthenticationButton buttonType={Apple.AppleAuthenticationButtonType.CONTINUE}
      buttonStyle={Apple.AppleAuthenticationButtonStyle.WHITE} cornerRadius={7} style={{ width: '100%', height: 48 }} onPress={onPress} />
  </View>;
}
