import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/core/theme/tokens';

export interface LoadingStateProps {
  message?: string;
  testID?: string;
}

/**
 * Estado de carregamento com texto — não depende apenas do indicador visual.
 */
export function LoadingState({ message = 'Carregando…', testID }: LoadingStateProps) {
  return (
    <View
      testID={testID}
      style={styles.container}
      accessibilityRole="progressbar"
      accessibilityLabel={message}
      accessibilityLiveRegion="polite"
    >
      <ActivityIndicator size="large" color={colors.chalkboardRaised} />
      <Text style={styles.texto}>{message}</Text>
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
  texto: {
    ...typography.body,
    color: colors.mutedInk,
    textAlign: 'center',
  },
});
