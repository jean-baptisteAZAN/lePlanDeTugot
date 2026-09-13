import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, spacing } from '@/theme';

type Props = {
  text: string;
  loading?: boolean;
};

export function CenteredMessage({ text, loading = false }: Props) {
  return (
    <View style={styles.container}>
      {loading ? <ActivityIndicator color={colors.ink} /> : null}
      {text ? <Text style={styles.text}>{text}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
    backgroundColor: colors.paper,
  },
  text: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.inkMuted,
    textAlign: 'center',
  },
});
