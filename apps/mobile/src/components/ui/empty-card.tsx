import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/design/tokens';

export function EmptyCard({ title, description }: { title: string; description: string }) {
  return (
    <View style={styles.card}>
      <Text accessibilityRole="header" style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    gap: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.warmOutline,
    backgroundColor: colors.warmCard,
  },
  title: { fontFamily: fonts.bold, fontSize: 19, color: colors.warmForeground },
  description: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 23, color: colors.muted },
});
