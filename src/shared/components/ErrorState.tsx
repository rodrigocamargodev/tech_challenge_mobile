import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/core/theme/tokens';

import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message: string;
  /** Rótulo do botão de nova tentativa. */
  retryLabel?: string;
  onRetry?: () => void;
  testID?: string;
}

/**
 * Estado de erro com ação de recuperação.
 *
 * O texto é sempre exibido (a cor é reforço) e o botão permite tentar de novo
 * sem sair da tela.
 */
export function ErrorState({
  title = 'Não foi possível carregar',
  message,
  retryLabel = 'Tentar novamente',
  onRetry,
  testID,
}: ErrorStateProps) {
  return (
    <View
      testID={testID}
      style={styles.container}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <View style={styles.marca} accessibilityElementsHidden importantForAccessibility="no">
        <Text style={styles.marcaTexto}>!</Text>
      </View>
      <Text style={styles.titulo}>{title}</Text>
      <Text style={styles.mensagem}>{message}</Text>
      {onRetry ? (
        <View style={styles.acao}>
          <Button label={retryLabel} variant="secondary" onPress={onRetry} testID={testID ? `${testID}-retry` : undefined} />
        </View>
      ) : null}
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
    backgroundColor: colors.chalkCoral,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  marcaTexto: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    color: colors.ink,
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
