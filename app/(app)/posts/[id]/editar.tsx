import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, minTouchTarget, radius, spacing, typography } from '@/core/theme/tokens';
import { RoleGuard } from '@/features/auth/components/RoleGuard';
import { PostForm } from '@/features/posts/components/PostForm';
import { traduzirErroPost, type ErroPost } from '@/features/posts/postErrors';
import { useAtualizarPost, usePost } from '@/features/posts/queries';
import type { PostFormData } from '@/features/posts/schemas';
import { Banner } from '@/shared/components/Banner';
import { ErrorState } from '@/shared/components/ErrorState';

/**
 * Edição de postagem — exclusiva de professor.
 *
 * Carrega o post atual (`GET /posts/:id`) para preencher o formulário e envia
 * `PUT /posts/:id`. Após o sucesso, o cache do detalhe e as listagens são
 * atualizados pelo hook de mutação.
 */
export default function EditarPostagemScreen() {
  return (
    <RoleGuard area="professor">
      <EditarPostagemConteudo />
    </RoleGuard>
  );
}

function EditarPostagemConteudo() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const postQuery = usePost(id);
  const atualizar = useAtualizarPost(id ?? '');
  const [erro, setErro] = useState<ErroPost | null>(null);

  const voltar = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/');
  };

  const enviar = (dados: PostFormData) => {
    setErro(null);

    atualizar.mutate(
      { titulo: dados.titulo, conteudo: dados.conteudo },
      {
        onSuccess: () => voltar(),
        onError: (falha) => setErro(traduzirErroPost(falha, 'salvar')),
      }
    );
  };

  const renderFormulario = () => {
    if (postQuery.isPending) {
      return (
        <View style={styles.estado} testID="post-editar-carregando">
          <ActivityIndicator size="large" color={colors.chalkboardRaised} />
          <Text style={styles.estadoTexto}>Carregando postagem…</Text>
        </View>
      );
    }

    if (postQuery.isError) {
      const traduzido = traduzirErroPost(postQuery.error, 'detalhe');
      return (
        <ErrorState
          testID="post-editar-erro"
          title="Postagem indisponível"
          message={traduzido.mensagem}
          onRetry={() => {
            void postQuery.refetch();
          }}
        />
      );
    }

    const post = postQuery.data;
    if (!post) return null;

    return (
      <View style={styles.card}>
        <PostForm
          valoresIniciais={{ titulo: post.titulo, conteudo: post.conteudo }}
          submitLabel="Salvar alterações"
          onSubmit={enviar}
          errosServidor={erro?.campos}
          erroGeral={erro?.mensagem}
          enviando={atualizar.isPending}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.barra}>
            <Pressable
              onPress={voltar}
              accessibilityRole="button"
              accessibilityLabel="Cancelar e voltar"
              style={styles.voltar}
            >
              <Text style={styles.voltarTexto}>‹ Cancelar</Text>
            </Pressable>
          </View>

          <View style={styles.cabecalho}>
            <Text style={styles.titulo} accessibilityRole="header">
              Editar postagem
            </Text>
            <Text style={styles.subtitulo}>
              A autoria original é preservada. Apenas título e conteúdo são alterados.
            </Text>
          </View>

          {erro?.mensagem ? (
            <Banner message={erro.mensagem} variant="error" testID="post-editar-erro-banner" />
          ) : null}

          {renderFormulario()}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  barra: {
    marginBottom: -spacing.sm,
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
  cabecalho: {
    gap: spacing.xs,
  },
  titulo: {
    ...typography.title,
    color: colors.ink,
  },
  subtitulo: {
    ...typography.body,
    color: colors.mutedInk,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
  },
  estado: {
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
