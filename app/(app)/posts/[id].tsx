import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, minTouchTarget, radius, spacing, typography } from '@/core/theme/tokens';
import { useAuth } from '@/features/auth/AuthContext';
import { traduzirErroPost } from '@/features/posts/postErrors';
import { useExcluirPost, usePost } from '@/features/posts/queries';
import { Button } from '@/shared/components/Button';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { ErrorState } from '@/shared/components/ErrorState';
import { formatarData } from '@/shared/utils/formatarData';

/**
 * Detalhe de uma postagem (`GET /posts/:id`).
 *
 * Público no backend, mas acessível apenas dentro do grupo autenticado.
 * Ações de edição/exclusão aparecem somente para professores.
 */
export default function PostDetalheScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isProfessor } = useAuth();

  const postQuery = usePost(id);
  const excluir = useExcluirPost();

  const [confirmando, setConfirmando] = useState(false);
  const [erroExclusao, setErroExclusao] = useState<string | null>(null);

  const voltar = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/');
  };

  const confirmarExclusao = () => {
    if (!id) return;

    setErroExclusao(null);
    excluir.mutate(id, {
      onSuccess: () => {
        setConfirmando(false);
        voltar();
      },
      onError: (falha) => {
        setErroExclusao(traduzirErroPost(falha, 'excluir').mensagem);
        setConfirmando(false);
      },
    });
  };

  const renderConteudo = () => {
    if (postQuery.isPending) {
      return (
        <View style={styles.estado} testID="post-detalhe-carregando">
          <ActivityIndicator size="large" color={colors.chalkboardRaised} />
          <Text style={styles.estadoTexto}>Carregando postagem…</Text>
        </View>
      );
    }

    if (postQuery.isError) {
      const erro = traduzirErroPost(postQuery.error, 'detalhe');
      return (
        <ErrorState
          testID="post-detalhe-erro"
          title="Postagem indisponível"
          message={erro.mensagem}
          onRetry={() => {
            void postQuery.refetch();
          }}
        />
      );
    }

    const post = postQuery.data;
    if (!post) return null;

    const dataCriacao = formatarData(post.criadoEm);
    const dataAtualizacao = formatarData(post.atualizadoEm);
    const editado = post.atualizadoEm !== post.criadoEm;

    return (
      <ScrollView contentContainerStyle={styles.scroll} testID="post-detalhe">
        <View style={styles.cabecalho}>
          <Text style={styles.titulo} accessibilityRole="header">
            {post.titulo}
          </Text>
          <View style={styles.metadados}>
            <Text style={styles.autor}>{post.autor}</Text>
            {dataCriacao ? <Text style={styles.data}>Publicado em {dataCriacao}</Text> : null}
            {editado && dataAtualizacao ? (
              <Text style={styles.data}>Atualizado em {dataAtualizacao}</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.corpo}>
          <Text style={styles.conteudo}>{post.conteudo}</Text>
        </View>

        {erroExclusao ? (
          <Text style={styles.erro} accessibilityRole="alert" accessibilityLiveRegion="polite">
            {erroExclusao}
          </Text>
        ) : null}

        {isProfessor ? (
          <View style={styles.acoes}>
            <Button
              label="Editar"
              testID="post-detalhe-editar"
              onPress={() => router.push(`/posts/${post._id}/editar`)}
            />
            <Button
              label="Excluir"
              variant="danger"
              testID="post-detalhe-excluir"
              onPress={() => setConfirmando(true)}
            />
          </View>
        ) : null}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.barra}>
        <Pressable
          onPress={voltar}
          accessibilityRole="button"
          accessibilityLabel="Voltar para a lista de postagens"
          style={styles.voltar}
        >
          <Text style={styles.voltarTexto}>‹ Voltar</Text>
        </Pressable>
      </View>

      {renderConteudo()}

      <ConfirmDialog
        visible={confirmando}
        testID="post-detalhe-confirmar-exclusao"
        title="Excluir postagem?"
        message="Esta postagem será removida permanentemente. Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        destructive
        loading={excluir.isPending}
        onConfirm={confirmarExclusao}
        onCancel={() => setConfirmando(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  barra: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  voltar: {
    alignSelf: 'flex-start',
    minHeight: minTouchTarget,
    justifyContent: 'center',
    paddingRight: spacing.md,
  },
  voltarTexto: {
    ...typography.bodyStrong,
    color: colors.chalkboardRaised,
  },
  scroll: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  cabecalho: {
    backgroundColor: colors.chalkboard,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  titulo: {
    ...typography.title,
    color: colors.chalkWhite,
  },
  metadados: {
    gap: spacing.xs,
  },
  autor: {
    ...typography.label,
    color: colors.chalkYellow,
  },
  data: {
    ...typography.caption,
    color: colors.chalkBlue,
  },
  corpo: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
  },
  conteudo: {
    ...typography.body,
    color: colors.ink,
  },
  acoes: {
    gap: spacing.sm,
  },
  erro: {
    ...typography.body,
    color: colors.ink,
    backgroundColor: colors.chalkCoral,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  estado: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  estadoTexto: {
    ...typography.body,
    color: colors.mutedInk,
    textAlign: 'center',
  },
});
