import { Platform, StyleSheet, Text, View } from 'react-native';

import { fonts } from '@/design/tokens';

import { useUiTheme } from './theme';

export function EmptyCard({ title, description }: { title: string; description: string }) {
  const theme = useUiTheme();
  return (
    <View style={[styles.card, { borderColor: theme.outline, backgroundColor: theme.surface }]}>
      <Text
        {...(Platform.OS === 'web' ? { 'aria-level': 2 } : {})}
        accessibilityRole="header"
        style={[styles.title, { color: theme.foreground }]}>
        {title}
      </Text>
      <Text style={[styles.description, { color: theme.muted }]}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    gap: 10,
    borderRadius: 24,
    borderWidth: 1,
  },
  title: { fontFamily: fonts.bold, fontSize: 19 },
  description: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 23 },
});
