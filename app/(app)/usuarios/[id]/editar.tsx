import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { useAuth } from '@/features/auth/AuthContext';
import { RoleGuard } from '@/features/auth/components/RoleGuard';
import { UserForm } from '@/features/users/components/UserForm';
import { useAtualizarUsuario, useUsuario } from '@/features/users/queries';
import { montarDadosUsuario, type UsuarioFormValues } from '@/features/users/schemas';
import type { DadosEdicaoUsuario, Papel, UsuarioPublico } from '@/features/users/types';
import { traduzirErroUsuario, type ErroUsuario } from '@/features/users/userErrors';
import { Banner } from '@/shared/components/Banner';
import { ErrorState } from '@/shared/components/ErrorState';
import { LoadingState } from '@/shared/components/LoadingState';

/**
 * Edição de usuário — exclusivo de professor.
 *
 * Envia `PUT /users/:id` apenas com os dados do formulário. Regras de negócio
 * do backend continuam valendo:
 * - não é possível alterar o próprio papel (`403`), então o campo é travado;
 * - não é possível desativar a própria conta (`403`), tratado na tela de detalhe.
 *
 * A desativação/reativação não acontece aqui: é uma ação separada, com
 * confirmação, na tela de detalhe.
 */
export default function EditarUsuarioScreen() {
  return (
    <RoleGuard area="professor">
      <EditarUsuarioConteudo />
    </RoleGuard>
  );
}

function EditarUsuarioConteudo() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const usuarioQuery = useUsuario(id);

  const voltar = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/usuarios');
  };

  const renderFormulario = () => {
    if (usuarioQuery.isPending) {
      return <LoadingState message="Carregando usuário…" testID="usuario-editar-carregando" />;
    }

    if (usuarioQuery.isError) {
      return (
        <ErrorState
          testID="usuario-editar-erro"
          title="Usuário indisponível"
          message={traduzirErroUsuario(usuarioQuery.error, 'detalhe').mensagem}
          onRetry={() => {
            void usuarioQuery.refetch();
          }}
        />
      );
    }

    const usuario = usuarioQuery.data;
    if (!usuario) return null;

    // O formulário só é montado com os dados carregados, então o papel inicial
    // pode ser derivado diretamente do usuário — sem efeito de sincronização.
    return <FormularioEdicaoUsuario usuario={usuario} onConcluir={voltar} />;
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
              Editar usuário
            </Text>
            <Text style={styles.subtitulo}>
              A senha só é alterada se você preencher o campo. A situação (ativo/inativo) é
              gerenciada na tela de detalhe.
            </Text>
          </View>

          {renderFormulario()}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

interface FormularioEdicaoUsuarioProps {
  usuario: UsuarioPublico;
  onConcluir: () => void;
}

function FormularioEdicaoUsuario({ usuario, onConcluir }: FormularioEdicaoUsuarioProps) {
  const { usuario: usuarioAutenticado } = useAuth();
  const atualizar = useAtualizarUsuario(usuario._id);

  const [papel, setPapel] = useState<Papel>(usuario.role);
  const [erro, setErro] = useState<ErroUsuario | null>(null);

  const enviar = (valores: UsuarioFormValues) => {
    setErro(null);

    const dados = montarDadosUsuario(valores, papel, 'edicao') as DadosEdicaoUsuario;

    atualizar.mutate(dados, {
      onSuccess: () => onConcluir(),
      onError: (falha) => setErro(traduzirErroUsuario(falha, 'editar')),
    });
  };

  return (
    <>
      {erro?.mensagem ? (
        <Banner message={erro.mensagem} variant="error" testID="usuario-editar-erro-banner" />
      ) : null}

      <View style={styles.card}>
        <UserForm
          modo="edicao"
          valoresIniciais={{ nome: usuario.nome, email: usuario.email }}
          papel={papel}
          onPapelChange={setPapel}
          papelBloqueado={usuario._id === usuarioAutenticado?._id}
          submitLabel="Salvar alterações"
          onSubmit={enviar}
          errosServidor={erro?.campos}
          enviando={atualizar.isPending}
        />
      </View>
    </>
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
