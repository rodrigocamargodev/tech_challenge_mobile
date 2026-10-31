import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
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
import { UserForm } from '@/features/users/components/UserForm';
import { useCriarUsuario } from '@/features/users/queries';
import { montarDadosUsuario, type UsuarioFormValues } from '@/features/users/schemas';
import type { DadosCriacaoUsuario, Papel } from '@/features/users/types';
import { traduzirErroUsuario, type ErroUsuario } from '@/features/users/userErrors';
import { Banner } from '@/shared/components/Banner';

/**
 * Cadastro de usuário — exclusivo de professor.
 *
 * `POST /users` aceita `role` explícito, permitindo criar professor ou aluno.
 * Diferente de `POST /auth/register` (público), que sempre cria aluno: aqui o
 * papel é uma escolha legítima do professor e continua validado pelo backend.
 */
export default function NovoUsuarioScreen() {
  return (
    <RoleGuard area="professor">
      <NovoUsuarioConteudo />
    </RoleGuard>
  );
}

function NovoUsuarioConteudo() {
  const router = useRouter();
  const criar = useCriarUsuario();

  const [papel, setPapel] = useState<Papel>('aluno');
  const [erro, setErro] = useState<ErroUsuario | null>(null);

  const voltar = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/usuarios');
  };

  const enviar = (valores: UsuarioFormValues) => {
    setErro(null);

    const dados = montarDadosUsuario(valores, papel, 'criacao') as DadosCriacaoUsuario;

    criar.mutate(dados, {
      onSuccess: () => voltar(),
      onError: (falha) => setErro(traduzirErroUsuario(falha, 'criar')),
    });
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
              Novo usuário
            </Text>
            <Text style={styles.subtitulo}>
              A conta é criada já ativa. Informe a senha inicial ao usuário — ela não pode ser
              consultada depois.
            </Text>
          </View>

          {erro?.mensagem ? (
            <Banner message={erro.mensagem} variant="error" testID="usuario-novo-erro" />
          ) : null}

          <View style={styles.card}>
            <UserForm
              modo="criacao"
              papel={papel}
              onPapelChange={setPapel}
              submitLabel="Criar usuário"
              onSubmit={enviar}
              errosServidor={erro?.campos}
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
