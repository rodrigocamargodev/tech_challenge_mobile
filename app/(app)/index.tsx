import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, minTouchTarget, radius, spacing, typography } from '@/core/theme/tokens';
import { useAuth } from '@/features/auth/AuthContext';
import { PostCard } from '@/features/posts/components/PostCard';
import { traduzirErroPost } from '@/features/posts/postErrors';
import { useBuscarPosts, useExcluirPost, useListarPosts } from '@/features/posts/queries';
import type { Post } from '@/features/posts/types';
import { Button } from '@/shared/components/Button';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { EmptyState } from '@/shared/components/EmptyState';
import { ErrorState } from '@/shared/components/ErrorState';
import { ScreenHeader } from '@/shared/components/ScreenHeader';
import { TextField } from '@/shared/components/TextField';
import { useDebounce } from '@/shared/hooks/useDebounce';

/**
 * Listagem e busca de postagens.
 *
 * Disponível para alunos e professores. As ações administrativas (criar,
 * editar, excluir) só são renderizadas para professores — e o backend continua
 * sendo a autoridade final, respondendo `403` se necessário.
 *
 * Estratégia de dados:
 * - sem termo → `GET /posts`;
 * - com termo (após debounce) → `GET /posts/search?termo=`;
 * - a listagem completa fica desabilitada enquanto a busca está ativa, para
 *   não disparar duas requisições concorrentes.
 */
export default function PostsScreen() {
  const router = useRouter();
  const { usuario, isProfessor, logout } = useAuth();

  const [termo, setTermo] = useState('');
  const termoDebounced = useDebounce(termo.trim(), 400);
  const buscando = termoDebounced.length > 0;

  const listaQuery = useListarPosts(!buscando);
  const buscaQuery = useBuscarPosts(termoDebounced);

  const queryAtiva = buscando ? buscaQuery : listaQuery;
  const posts = useMemo<Post[]>(() => queryAtiva.data ?? [], [queryAtiva.data]);

  const excluir = useExcluirPost();
  const [postParaExcluir, setPostParaExcluir] = useState<Post | null>(null);
  const [erroExclusao, setErroExclusao] = useState<string | null>(null);

  const erro = queryAtiva.error ? traduzirErroPost(queryAtiva.error, 'lista') : null;

  const recarregar = () => {
    void queryAtiva.refetch();
  };

  const confirmarExclusao = () => {
    if (!postParaExcluir) return;

    setErroExclusao(null);
    excluir.mutate(postParaExcluir._id, {
      onSuccess: () => setPostParaExcluir(null),
      onError: (falha) => {
        setErroExclusao(traduzirErroPost(falha, 'excluir').mensagem);
        setPostParaExcluir(null);
      },
    });
  };

  const limparBusca = () => setTermo('');

  const renderConteudo = () => {
    if (queryAtiva.isPending) {
      return (
        <View style={styles.estado} testID="posts-carregando">
          <ActivityIndicator size="large" color={colors.chalkboardRaised} />
          <Text style={styles.estadoTexto}>
            {buscando ? 'Buscando postagens…' : 'Carregando postagens…'}
          </Text>
        </View>
      );
    }

    if (erro) {
      return (
        <ErrorState
          testID="posts-erro"
          title={buscando ? 'Não foi possível buscar' : 'Não foi possível carregar'}
          message={erro.mensagem}
          onRetry={recarregar}
        />
      );
    }

    if (posts.length === 0) {
      return buscando ? (
        <EmptyState
          testID="posts-vazio-busca"
          title="Nenhuma postagem encontrada"
          message={`Não encontramos resultados para “${termoDebounced}”. Tente outro termo ou limpe a busca.`}
          action={
            <Button
              label="Limpar busca"
              variant="secondary"
              onPress={limparBusca}
              testID="posts-limpar-busca"
            />
          }
        />
      ) : (
        <EmptyState
          testID="posts-vazio"
          title="A lousa está em branco"
          message={
            isProfessor
              ? 'Nenhuma postagem publicada ainda. Crie a primeira usando o botão acima.'
              : 'Nenhuma postagem publicada ainda. Volte mais tarde para conferir as novidades.'
          }
        />
      );
    }

    return (
      <FlatList
        testID="posts-lista"
        data={posts}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listaConteudo}
        ItemSeparatorComponent={() => <View style={styles.separador} />}
        refreshControl={
          <RefreshControl
            refreshing={queryAtiva.isRefetching}
            onRefresh={recarregar}
            tintColor={colors.chalkboardRaised}
          />
        }
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onPress={() => router.push(`/posts/${item._id}`)}
            onEditar={isProfessor ? () => router.push(`/posts/${item._id}/editar`) : undefined}
            onExcluir={isProfessor ? () => setPostParaExcluir(item) : undefined}
          />
        )}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.cabecalhoArea}>
        <ScreenHeader
          title="Blog de Giz"
          subtitle={`Olá, ${usuario?.nome ?? 'visitante'}!`}
          showBrand
          action={
            isProfessor ? (
              <Button
                label="Nova"
                testID="posts-nova"
                onPress={() => router.push('/posts/novo')}
                accessibilityHint="Abre o formulário de nova postagem"
              />
            ) : undefined
          }
        />

        {isProfessor ? (
          <Button
            label="Gerenciar usuários"
            variant="secondary"
            testID="home-usuarios"
            onPress={() => router.push('/usuarios')}
            accessibilityHint="Abre a lista de professores e alunos"
          />
        ) : null}

        <TextField
          label="Buscar postagens"
          testID="posts-busca"
          value={termo}
          onChangeText={setTermo}
          placeholder="Título ou conteúdo…"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          hint={
            buscando
              ? `Resultados para “${termoDebounced}”.`
              : 'Digite para buscar por título ou conteúdo.'
          }
        />

        {termo.length > 0 ? (
          <Pressable
            onPress={limparBusca}
            accessibilityRole="button"
            accessibilityLabel="Limpar busca"
            style={styles.limpar}
          >
            <Text style={styles.limparTexto}>Limpar busca</Text>
          </Pressable>
        ) : null}

        {erroExclusao ? (
          <Text
            style={styles.erroExclusao}
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
          >
            {erroExclusao}
          </Text>
        ) : null}
      </View>

      <View style={styles.conteudo}>{renderConteudo()}</View>

      <View style={styles.rodape}>
        <Button
          label="Sair"
          variant="secondary"
          testID="home-logout"
          onPress={() => {
            void logout();
          }}
          accessibilityHint="Encerra sua sessão e volta para a tela de login"
        />
      </View>

      <ConfirmDialog
        visible={postParaExcluir !== null}
        testID="posts-confirmar-exclusao"
        title="Excluir postagem?"
        message={
          postParaExcluir
            ? `“${postParaExcluir.titulo}” será removida permanentemente. Esta ação não pode ser desfeita.`
            : ''
        }
        confirmLabel="Excluir"
        destructive
        loading={excluir.isPending}
        onConfirm={confirmarExclusao}
        onCancel={() => setPostParaExcluir(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  cabecalhoArea: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  conteudo: {
    flex: 1,
  },
  listaConteudo: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  separador: {
    height: spacing.md,
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
  limpar: {
    alignSelf: 'flex-start',
    minHeight: minTouchTarget,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
  },
  limparTexto: {
    ...typography.label,
    color: colors.chalkboardRaised,
    textDecorationLine: 'underline',
  },
  erroExclusao: {
    ...typography.body,
    color: colors.ink,
    backgroundColor: colors.chalkCoral,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  rodape: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.sm,
  },
});
