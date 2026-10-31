import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, minTouchTarget, radius, spacing, typography } from '@/core/theme/tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'danger';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  /** Desabilita o botão e exibe indicador de carregamento. */
  loading?: boolean;
  disabled?: boolean;
  accessibilityHint?: string;
  testID?: string;
}

const estilosPorVariante = {
  primary: {
    container: { backgroundColor: colors.chalkYellow },
    texto: { color: colors.ink },
    indicador: colors.ink,
  },
  secondary: {
    container: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    texto: { color: colors.ink },
    indicador: colors.ink,
  },
  danger: {
    container: { backgroundColor: colors.chalkCoral },
    texto: { color: colors.ink },
    indicador: colors.ink,
  },
} as const;

/**
 * Botão principal do design system.
 *
 * Acessibilidade:
 * - `accessibilityRole="button"`;
 * - estado `disabled`/`busy` exposto ao leitor de tela;
 * - alvo de toque mínimo de 44pt;
 * - o rótulo permanece visível durante o carregamento (não depende só da cor).
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  accessibilityHint,
  testID,
}: ButtonProps) {
  const desabilitado = disabled || loading;
  const estilos = estilosPorVariante[variant];

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={desabilitado}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: desabilitado, busy: loading }}
      style={({ pressed }) => [
        styles.container,
        estilos.container,
        desabilitado && styles.desabilitado,
        pressed && !desabilitado && styles.pressionado,
      ]}
    >
      <View style={styles.conteudo}>
        {loading ? (
          <ActivityIndicator
            size="small"
            color={estilos.indicador}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
        ) : null}
        <Text style={[styles.texto, estilos.texto]}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: minTouchTarget,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  conteudo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  texto: {
    ...typography.bodyStrong,
  },
  desabilitado: {
    opacity: 0.6,
  },
  pressionado: {
    opacity: 0.85,
  },
});
