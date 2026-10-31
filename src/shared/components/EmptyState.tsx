import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/core/theme/tokens';

export interface EmptyStateProps {
  title: string;
  /** Orientação sobre o que fazer a seguir. */
  message: string;
  testID?: string;
  /** Ação opcional (ex.: botão "Limpar busca"). */
  action?: ReactNode;
}

/**
 * Estado vazio orientativo.
 *
 * Não é apenas "nada aqui": explica o motivo e sugere o próximo passo, o que
 * é especialmente importante para alunos que chegam a uma busca sem resultado.
 */
export function EmptyState({ title, message, action, testID }: EmptyStateProps) {
  return (
    <View
      testID={testID}
      style={styles.container}
      accessibilityRole="summary"
      accessibilityLabel={`${title}. ${message}`}
    >
      <View style={styles.marca} accessibilityElementsHidden importantForAccessibility="no">
        <Text style={styles.marcaTexto}>✎</Text>
      </View>
      <Text style={styles.titulo}>{title}</Text>
      <Text style={styles.mensagem}>{message}</Text>
      {action ? <View style={styles.acao}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  marca: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.chalkboardRaised,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  marcaTexto: {
    fontSize: 26,
    lineHeight: 32,
    color: colors.chalkYellow,
  },
  titulo: {
    ...typography.subtitle,
    color: colors.ink,
    textAlign: 'center',
  },
  mensagem: {
    ...typography.body,
    color: colors.mutedInk,
    textAlign: 'center',
  },
  acao: {
    marginTop: spacing.md,
    alignSelf: 'stretch',
  },
});
