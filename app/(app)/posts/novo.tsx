import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, minTouchTarget, radius, spacing, typography } from '@/core/theme/tokens';
import { RoleGuard } from '@/features/auth/components/RoleGuard';
import { PostForm } from '@/features/posts/components/PostForm';
import { traduzirErroPost, type ErroPost } from '@/features/posts/postErrors';
import { useCriarPost } from '@/features/posts/queries';
import type { PostFormData } from '@/features/posts/schemas';
import { Banner } from '@/shared/components/Banner';

/**
 * Criação de postagem — exclusiva de professor.
 *
 * Protegida por `RoleGuard area="professor"`: um aluno que chegue a esta rota
 * é redirecionado antes de qualquer renderização do formulário. O backend
 * também responde `403` caso a requisição seja feita sem o papel correto.
 *
 * O campo `autor` não é enviado: o backend o obtém do token.
 */
export default function NovaPostagemScreen() {
  return (
    <RoleGuard area="professor">
      <NovaPostagemConteudo />
    </RoleGuard>
  );
}

function NovaPostagemConteudo() {
  const router = useRouter();
  const criar = useCriarPost();
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

    criar.mutate(
      { titulo: dados.titulo, conteudo: dados.conteudo },
      {
        onSuccess: () => voltar(),
        onError: (falha) => setErro(traduzirErroPost(falha, 'salvar')),
      }
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
              Nova postagem
            </Text>
            <Text style={styles.subtitulo}>
              A autoria é registrada automaticamente com base na sua conta de professor.
            </Text>
          </View>

          {erro?.mensagem ? (
            <Banner message={erro.mensagem} variant="error" testID="post-novo-erro" />
          ) : null}

          <View style={styles.card}>
            <PostForm
              submitLabel="Publicar"
              onSubmit={enviar}
              errosServidor={erro?.campos}
              erroGeral={erro?.mensagem}
              enviando={criar.isPending}
            />
          </View>
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
});
