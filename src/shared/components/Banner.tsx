import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/core/theme/tokens';

export type BannerVariant = 'error' | 'info' | 'success';

export interface BannerProps {
  message: string;
  variant?: BannerVariant;
  testID?: string;
}

const estilosPorVariante = {
  error: { container: { backgroundColor: colors.chalkCoral }, texto: { color: colors.ink } },
  info: { container: { backgroundColor: colors.chalkBlue }, texto: { color: colors.ink } },
  // Sucesso usa o verde institucional com texto claro: distingue-se do azul de
  // informação sem depender apenas do texto.
  success: {
    container: { backgroundColor: colors.chalkboardRaised },
    texto: { color: colors.chalkWhite },
  },
} as const;

/**
 * Mensagem de feedback (erro, informação ou sucesso).
 *
 * O texto é sempre exibido — a cor é apenas reforço visual. `accessibilityRole`
 * e `liveRegion` garantem o anúncio em TalkBack/VoiceOver.
 */
export function Banner({ message, variant = 'error', testID }: BannerProps) {
  const estilos = estilosPorVariante[variant];

  return (
    <View
      testID={testID}
      style={[styles.container, estilos.container]}
      accessibilityRole={variant === 'error' ? 'alert' : 'text'}
      accessibilityLiveRegion="polite"
    >
      <Text style={[styles.texto, estilos.texto]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  texto: {
    ...typography.body,
  },
});
