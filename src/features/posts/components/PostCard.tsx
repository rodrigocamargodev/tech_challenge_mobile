import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, minTouchTarget, radius, spacing, typography } from '@/core/theme/tokens';
import { formatarData, resumirTexto } from '@/shared/utils/formatarData';

import type { Post } from '../types';

export interface PostCardProps {
  post: Post;
  onPress: () => void;
  /** Ações administrativas (professor). Ausentes para alunos. */
  onEditar?: () => void;
  onExcluir?: () => void;
}

/**
 * Card de postagem na listagem.
 *
 * Hierarquia visual: título (destaque) → resumo do conteúdo → autor e data
 * (metadados discretos). O card inteiro é tocável para abrir o detalhe.
 *
 * As ações de edição/exclusão só são renderizadas quando os callbacks são
 * fornecidos — o aluno nunca recebe esses botões.
 */
export function PostCard({ post, onPress, onEditar, onExcluir }: PostCardProps) {
  const data = formatarData(post.criadoEm);
  const temAcoes = Boolean(onEditar || onExcluir);

  return (
    <View style={styles.card}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Abrir postagem: ${post.titulo}`}
        accessibilityHint="Abre o conteúdo completo da postagem"
        style={({ pressed }) => [styles.conteudo, pressed && styles.pressionado]}
      >
        <Text style={styles.titulo} numberOfLines={2}>
          {post.titulo}
        </Text>
        <Text style={styles.resumo} numberOfLines={3}>
          {resumirTexto(post.conteudo)}
        </Text>
        <View style={styles.metadados}>
          <Text style={styles.autor} numberOfLines={1}>
            {post.autor}
          </Text>
          {data ? (
            <>
              <Text style={styles.separador} accessibilityElementsHidden importantForAccessibility="no">
                •
              </Text>
              <Text style={styles.data}>{data}</Text>
            </>
          ) : null}
        </View>
      </Pressable>

      {temAcoes ? (
        <View style={styles.acoes}>
          {onEditar ? (
            <Pressable
              onPress={onEditar}
              accessibilityRole="button"
              accessibilityLabel={`Editar postagem: ${post.titulo}`}
              style={({ pressed }) => [styles.acao, pressed && styles.pressionado]}
            >
              <Text style={styles.acaoTexto}>Editar</Text>
            </Pressable>
          ) : null}
          {onExcluir ? (
            <Pressable
              onPress={onExcluir}
              accessibilityRole="button"
              accessibilityLabel={`Excluir postagem: ${post.titulo}`}
              style={({ pressed }) => [styles.acao, styles.acaoPerigo, pressed && styles.pressionado]}
            >
              <Text style={styles.acaoTexto}>Excluir</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  conteudo: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  pressionado: {
    opacity: 0.85,
  },
  titulo: {
    ...typography.subtitle,
    color: colors.ink,
  },
  resumo: {
    ...typography.body,
    color: colors.mutedInk,
  },
  metadados: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  autor: {
    ...typography.caption,
    color: colors.ink,
    fontWeight: '600',
    flexShrink: 1,
  },
  separador: {
    ...typography.caption,
    color: colors.mutedInk,
  },
  data: {
    ...typography.caption,
    color: colors.mutedInk,
  },
  acoes: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  acao: {
    flex: 1,
    minHeight: minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  acaoPerigo: {
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },
  acaoTexto: {
    ...typography.label,
    color: colors.ink,
  },
});
