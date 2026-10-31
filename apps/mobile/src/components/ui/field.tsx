import { forwardRef, useId, useState, type ComponentRef, type ReactNode } from 'react';
import { Platform, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { fonts } from '@/design/tokens';

import { useAnnouncement } from './use-announcement';
import { useUiTheme } from './theme';

export type FieldProps = Omit<
  TextInputProps,
  'style' | 'accessibilityLabel' | 'accessibilityHint'
> & {
  label: string;
  hint?: string;
  error?: string;
  trailingVisual?: ReactNode;
};

/** Raw values are passed through unchanged. Validation and submit/focus policy belong to the form. */
export const Field = forwardRef<ComponentRef<typeof TextInput>, FieldProps>(function Field(
  { label, hint, error, trailingVisual, editable = true, nativeID, onFocus, onBlur, ...props },
  ref,
) {
  const generatedId = useId();
  const id = nativeID ?? `field-${generatedId}`;
  const theme = useUiTheme();
  const [focused, setFocused] = useState(false);
  useAnnouncement(error ? `${label}. ${error}` : undefined);
  const webAccessibility =
    Platform.OS === 'web'
      ? {
          'aria-labelledby': `${id}-label`,
          'aria-describedby':
            [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined,
          'aria-invalid': Boolean(error),
        }
      : {};

  return (
    <View style={styles.field}>
      <Text nativeID={`${id}-label`} style={[styles.label, { color: theme.field.label }]}>
        {label}
      </Text>
      <View style={styles.inputRow}>
      <TextInput
        {...props}
        {...webAccessibility}
        ref={ref}
        nativeID={id}
        editable={editable}
        accessibilityLabel={error ? `${label}. ${error}` : label}
        accessibilityHint={hint}
        accessibilityLabelledBy={
          Platform.OS === 'android'
            ? error
              ? [`${id}-label`, `${id}-error`]
              : `${id}-label`
            : undefined
        }
        accessibilityState={{ disabled: !editable }}
        aria-disabled={!editable}
        placeholderTextColor={theme.field.placeholder}
        selectionColor={theme.focus}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        style={[
          styles.input,
          {
            backgroundColor: theme.field.background,
            color: theme.field.foreground,
            borderRadius: theme.field.radius,
            minHeight: theme.field.minHeight,
            paddingHorizontal: theme.field.paddingHorizontal,
            paddingVertical: theme.field.paddingVertical,
            fontFamily: theme.field.fontFamily,
            fontSize: theme.field.fontSize,
            borderColor: error ? theme.error : focused ? theme.focus : theme.field.border,
          },
          trailingVisual ? { paddingRight: 40 } : undefined,
          !editable && styles.disabled,
        ]}
      />
      {trailingVisual ? <View style={styles.trailing} pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" aria-hidden>{trailingVisual}</View> : null}
      </View>
      {hint ? (
        <Text nativeID={`${id}-hint`} style={[styles.detail, { color: theme.muted }]}>
          {hint}
        </Text>
      ) : null}
      {error ? (
        <Text
          nativeID={`${id}-error`}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          aria-live="polite"
          style={[styles.detail, { color: theme.error }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  field: { gap: 6 },
  inputRow: { position: 'relative' },
  trailing: { position: 'absolute', right: 12, top: 0, bottom: 0, justifyContent: 'center' },
  label: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 17 },
  input: { borderWidth: 1, lineHeight: 22 },
  detail: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19 },
  disabled: { opacity: 0.5 },
});
