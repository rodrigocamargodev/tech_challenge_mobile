import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/core/theme/tokens';

import { BrandMark } from './BrandMark';

export interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  /** Ação à direita (ex.: botão "Nova postagem"). */
  action?: ReactNode;
  /** Exibe a marca à esquerda do título. Padrão: `false`. */
  showBrand?: boolean;
}

/**
 * Cabeçalho institucional das telas internas.
 *
 * Mantém o verde-lousa do tema e concentra título, subtítulo e ação principal,
 * garantindo hierarquia visual consistente entre as telas.
 *
 * `showBrand` é usado apenas na home: nas telas internas o título já identifica
 * a seção, e repetir a marca em todas elas viraria ruído visual.
 */
export function ScreenHeader({ title, subtitle, action, showBrand = false }: ScreenHeaderProps) {
  return (
    <View style={styles.container}>
      {showBrand ? <BrandMark size={40} testID="header-marca" /> : null}
      <View style={styles.textos}>
        <Text style={styles.titulo} accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? <Text style={styles.subtitulo}>{subtitle}</Text> : null}
      </View>
      {action ? <View style={styles.acao}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.chalkboard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  textos: {
    flex: 1,
    gap: spacing.xs,
  },
  titulo: {
    ...typography.title,
    color: colors.chalkWhite,
  },
  subtitulo: {
    ...typography.body,
    color: colors.chalkBlue,
  },
  acao: {
    flexShrink: 0,
  },
});
