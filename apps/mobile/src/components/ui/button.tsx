import { forwardRef, type ComponentRef } from 'react';
import type { Pressable, PressableProps } from 'react-native';

import { ButtonSurface, type ButtonSurfaceProps } from './button-surface';
import { usePressGuard } from './use-press-guard';

export type ButtonProps = Omit<ButtonSurfaceProps, 'onPress' | 'accessibilityRole' | 'role'> & {
  onPress: NonNullable<PressableProps['onPress']>;
};

/**
 * Controlled action: the caller sets busy synchronously for the whole operation,
 * catches its errors, and owns cancellation. Also reject same-turn duplicate taps
 * before React can deliver that busy update. This is not server idempotency.
 */
export const Button = forwardRef<ComponentRef<typeof Pressable>, ButtonProps>(function Button(
  { onPress, busy = false, disabled = false, ...props },
  ref,
) {
  const handlePress = usePressGuard(onPress, busy || disabled);
  return (
    <ButtonSurface {...props} ref={ref} busy={busy} disabled={disabled} onPress={handlePress} />
  );
});
