import { forwardRef, useState, type ComponentRef } from 'react';
import { Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

import { colors, fonts } from '@/design/tokens';

import { ProgressIndicator } from './progress-indicator';
import { useUiTheme } from './theme';

export type ButtonSurfaceProps = Omit<PressableProps, 'children' | 'accessibilityState'> & {
  label: string;
  busy?: boolean;
  busyLabel?: string;
  variant?: 'primary' | 'secondary';
};

/** Internal presentation shared by action buttons and Router links. */
export const ButtonSurface = forwardRef<ComponentRef<typeof Pressable>, ButtonSurfaceProps>(
  function ButtonSurface(
    {
      label,
      busy = false,
      busyLabel = label,
      disabled = false,
      variant = 'primary',
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
    const accessibleLabel = props['aria-label'] ?? accessibilityLabel ?? (busy ? busyLabel : label);
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
        <Text style={[styles.label, { color: foreground, fontSize: primary ? 18 : 16 }]}>
          {busy ? busyLabel : label}
        </Text>
      </Pressable>
    );
  },
);

const styles = StyleSheet.create({
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
