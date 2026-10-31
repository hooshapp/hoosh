import { forwardRef, useState, type ComponentRef, type ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type TextStyle,
} from 'react-native';

import { colors, fonts } from '@/design/tokens';

import { ProgressIndicator } from './progress-indicator';
import { useUiTheme } from './theme';

export type ButtonSurfaceProps = Omit<PressableProps, 'children' | 'accessibilityState'> & {
  label: string;
  description?: string;
  busy?: boolean;
  busyLabel?: string;
  variant?: 'primary' | 'secondary';
  /** Decorative slots only; the text/accessibility label still names the action. */
  leadingVisual?: ReactNode;
  trailingVisual?: ReactNode;
  labelStyle?: StyleProp<TextStyle>;
  descriptionStyle?: StyleProp<TextStyle>;
};

/** Internal presentation shared by action buttons and Router links. */
export const ButtonSurface = forwardRef<ComponentRef<typeof Pressable>, ButtonSurfaceProps>(
  function ButtonSurface(
    {
      label,
      description,
      busy = false,
      busyLabel = label,
      disabled = false,
      variant = 'primary',
      leadingVisual,
      trailingVisual,
      labelStyle,
      descriptionStyle,
      accessibilityLabel,
      accessibilityRole = 'button',
      style,
      onFocus,
      onBlur,
      ...props
    },
    ref,
  ) {
    const theme = useUiTheme();
    const [focused, setFocused] = useState(false);
    const primary = variant === 'primary';
    const foreground = primary ? colors.actionLabel : theme.foreground;
    const accessibleLabel =
      props['aria-label'] ??
      accessibilityLabel ??
      (busy ? busyLabel : description ? `${label}. ${description}` : label);
    return (
      <Pressable
        {...props}
        ref={ref}
        accessibilityRole={accessibilityRole}
        accessibilityLabel={accessibleLabel}
        aria-label={accessibleLabel}
        aria-busy={busy}
        aria-disabled={disabled || busy}
        accessibilityState={{ busy, disabled: disabled || busy }}
        disabled={disabled || busy}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        style={(state) => [
          styles.button,
          primary ? styles.primary : styles.secondary,
          {
            backgroundColor: primary ? colors.action : theme.surface,
            borderColor: primary ? 'transparent' : theme.outline,
          },
          {
            outlineColor: theme.focus,
            outlineStyle: 'solid',
            outlineWidth: focused ? 2 : 0,
            outlineOffset: 3,
          },
          state.pressed && styles.pressed,
          disabled && styles.disabled,
          typeof style === 'function' ? style(state) : style,
        ]}>
        {busy ? <ProgressIndicator color={foreground} /> : null}
        {!busy && leadingVisual ? (
          <View
            accessible={false}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            aria-hidden>
            {leadingVisual}
          </View>
        ) : null}
        {description ? (
          <View style={styles.textGroup}>
            <Text
              style={[
                styles.label,
                { color: foreground, fontSize: primary ? 18 : 16 },
                labelStyle,
              ]}>
              {busy ? busyLabel : label}
            </Text>
            <Text style={[styles.description, { color: theme.muted }, descriptionStyle]}>{description}</Text>
          </View>
        ) : (
          <Text
            style={[styles.label, { color: foreground, fontSize: primary ? 18 : 16 }, labelStyle]}>
            {busy ? busyLabel : label}
          </Text>
        )}
        {!busy && trailingVisual ? (
          <View
            accessible={false}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            aria-hidden>
            {trailingVisual}
          </View>
        ) : null}
      </Pressable>
    );
  },
);

const styles = StyleSheet.create({
  textGroup: { flex: 1, minWidth: 0, gap: 2 },
  description: { fontFamily: fonts.regular, fontSize: 11, lineHeight: 14 },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderRadius: 10,
  },
  primary: { minHeight: 52, paddingVertical: 13 },
  secondary: { minHeight: 48, paddingVertical: 11 },
  label: { flexShrink: 1, textAlign: 'center', fontFamily: fonts.bold, lineHeight: 24 },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.5 },
});
