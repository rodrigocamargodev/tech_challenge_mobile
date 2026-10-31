import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, minTouchTarget, radius, spacing, typography } from '@/core/theme/tokens';

import { rotuloPapel } from '../schemas';
import type { UsuarioPublico } from '../types';

export interface UserCardProps {
  usuario: UsuarioPublico;
  onPress: () => void;
  onEditar: () => void;
  /** Ausente para o próprio usuário autenticado (o backend responde 403). */
  onDesativar?: () => void;
  /** Quando `false`, o botão de reativar substitui o de desativar. */
  onReativar?: () => void;
  /** Indica que a ação em andamento é deste card. */
  processando?: boolean;
  /** Impede ações (ex.: enquanto outra mutação está em curso). */
  acoesBloqueadas?: boolean;
}

/**
 * Card de usuário na listagem administrativa.
 *
 * Exibe nome, e-mail, papel e situação (ativo/inativo). A situação nunca é
 * comunicada apenas por cor: há sempre um rótulo textual.
 *
 * Ações: abrir detalhe (card inteiro), editar e desativar/reativar. O botão de
 * desativar não é renderizado quando o callback não é fornecido — é o caso do
 * próprio professor logado, que não pode se desativar.
 */
export function UserCard({
  usuario,
  onPress,
  onEditar,
  onDesativar,
  onReativar,
  processando = false,
  acoesBloqueadas = false,
}: UserCardProps) {
  const inativo = !usuario.ativo;
  const bloquear = processando || acoesBloqueadas;

  return (
    <View style={[styles.card, inativo && styles.cardInativo]}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Abrir usuário: ${usuario.nome}`}
        accessibilityHint="Abre os detalhes do usuário"
        style={({ pressed }) => [styles.conteudo, pressed && styles.pressionado]}
      >
        <View style={styles.topo}>
          <Text style={styles.nome} numberOfLines={2}>
            {usuario.nome}
          </Text>
          <Text style={[styles.situacao, inativo && styles.situacaoInativa]}>
            {inativo ? 'Inativo' : 'Ativo'}
          </Text>
        </View>

        <Text style={styles.email} numberOfLines={1}>
          {usuario.email}
        </Text>

        <Text style={styles.papel}>{rotuloPapel(usuario.role)}</Text>
      </Pressable>

      <View style={styles.acoes}>
        <Pressable
          onPress={onEditar}
          disabled={bloquear}
          accessibilityRole="button"
          accessibilityLabel={`Editar usuário: ${usuario.nome}`}
          accessibilityState={{ disabled: bloquear }}
          style={({ pressed }) => [
            styles.acao,
            bloquear && styles.acaoDesabilitada,
            pressed && !bloquear && styles.pressionado,
          ]}
        >
          <Text style={styles.acaoTexto}>Editar</Text>
        </Pressable>

        {onDesativar && !inativo ? (
          <Pressable
            onPress={onDesativar}
            disabled={bloquear}
            accessibilityRole="button"
            accessibilityLabel={`Desativar usuário: ${usuario.nome}`}
            accessibilityState={{ disabled: bloquear }}
            style={({ pressed }) => [
              styles.acao,
              styles.acaoSeparada,
              bloquear && styles.acaoDesabilitada,
              pressed && !bloquear && styles.pressionado,
            ]}
          >
            <Text style={styles.acaoTexto}>Desativar</Text>
          </Pressable>
        ) : null}

        {onReativar && inativo ? (
          <Pressable
            onPress={onReativar}
            disabled={bloquear}
            accessibilityRole="button"
            accessibilityLabel={`Reativar usuário: ${usuario.nome}`}
            accessibilityState={{ disabled: bloquear }}
            style={({ pressed }) => [
              styles.acao,
              styles.acaoSeparada,
              bloquear && styles.acaoDesabilitada,
              pressed && !bloquear && styles.pressionado,
            ]}
          >
            <Text style={styles.acaoTexto}>Reativar</Text>
          </Pressable>
        ) : null}
      </View>
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
  cardInativo: {
    borderStyle: 'dashed',
    backgroundColor: colors.paper,
  },
  conteudo: {
    padding: spacing.lg,
    gap: spacing.xs,
  },
  pressionado: {
    opacity: 0.85,
  },
  topo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  nome: {
    ...typography.subtitle,
    color: colors.ink,
    flex: 1,
  },
  situacao: {
    ...typography.caption,
    color: colors.ink,
    backgroundColor: colors.chalkBlue,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    overflow: 'hidden',
    fontWeight: '600',
  },
  situacaoInativa: {
    backgroundColor: colors.chalkCoral,
  },
  email: {
    ...typography.body,
    color: colors.mutedInk,
  },
  papel: {
    ...typography.caption,
    color: colors.ink,
    fontWeight: '600',
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
  acaoSeparada: {
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },
  acaoDesabilitada: {
    opacity: 0.5,
  },
  acaoTexto: {
    ...typography.label,
    color: colors.ink,
  },
});
