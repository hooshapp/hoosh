/** Figma stylebook 10611:12784. Contextual recipes stay separate. */
export const colors = {
  action: '#33C659',
  success: '#0B9968',
  warmForeground: '#3D2800',
  warmCanvas: '#FFF1DD',
  warmCard: '#FFFAF2',
  warmHeader: '#FFD8A1',
  darkCanvas: '#222222',
  darkCard: '#2A2A2A',
  darkNav: '#1A1A1A',
  warmOutline: '#E8D5B0',
  divider: '#E8DCC8',
  muted: '#625D54',
  darkMuted: '#ADADAD',
  white: '#FFFFFF',
  onAction: '#0B3320',
  actionLabel: '#111111',
  fieldForeground: '#1A1A1A',
  fieldLabel: '#766950',
  // Stronger than the Figma decorative outline: identifiable editable field boundaries.
  fieldOutline: '#9A8662',
  darkFocus: '#9EE6AE',
  darkOutline: 'rgba(255,255,255,0.06)',
  darkField: 'rgba(255,255,255,0.3)',
  // Accessible failure treatments are engineering additions; Figma omits these states.
  error: '#B42318',
  darkError: '#FFB4AB',
} as const;

export const fonts = {
  light: 'SpaceGrotesk_300Light',
  regular: 'SpaceGrotesk_400Regular',
  medium: 'SpaceGrotesk_500Medium',
  bold: 'SpaceGrotesk_700Bold',
} as const;

/** Contextual recipes, not a universal radius or typography scale. */
export const uiRecipes = {
  warm: {
    canvas: colors.warmCanvas,
    foreground: colors.warmForeground,
    muted: colors.muted,
    surface: colors.warmCard,
    outline: colors.warmOutline,
    error: colors.error,
    focus: colors.success,
    field: {
      background: colors.warmCard,
      foreground: colors.fieldForeground,
      label: colors.fieldLabel,
      placeholder: colors.muted,
      border: colors.fieldOutline,
      radius: 16,
      minHeight: 44,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontFamily: fonts.medium,
      fontSize: 15,
    },
  },
  dark: {
    canvas: colors.darkCanvas,
    foreground: colors.white,
    muted: colors.darkMuted,
    surface: colors.darkCard,
    outline: colors.darkOutline,
    error: colors.darkError,
    focus: colors.darkFocus,
    field: {
      background: colors.darkField,
      foreground: colors.white,
      label: colors.white,
      placeholder: colors.white,
      border: colors.darkMuted,
      radius: 7,
      minHeight: 48,
      paddingHorizontal: 18,
      paddingVertical: 12,
      fontFamily: fonts.light,
      fontSize: 16,
    },
  },
} as const;

export type UiTheme = keyof typeof uiRecipes;
