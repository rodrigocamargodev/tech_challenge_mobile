import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, minTouchTarget, radius, spacing, typography } from '@/core/theme/tokens';
import { useAuth } from '@/features/auth/AuthContext';
import { RoleGuard } from '@/features/auth/components/RoleGuard';
import { useDesativarUsuario, useReativarUsuario, useUsuario } from '@/features/users/queries';
import { rotuloPapel } from '@/features/users/schemas';
import type { UsuarioPublico } from '@/features/users/types';
import { traduzirErroUsuario } from '@/features/users/userErrors';
import { Banner } from '@/shared/components/Banner';
import { Button } from '@/shared/components/Button';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { ErrorState } from '@/shared/components/ErrorState';
import { LoadingState } from '@/shared/components/LoadingState';
import { formatarData } from '@/shared/utils/formatarData';

/**
 * Detalhe de um usuário (`GET /users/:id`) — exclusivo de professor.
 *
 * Mostra apenas dados públicos devolvidos pela API. Nunca há senha, hash ou
 * token nesta tela, porque a API não os expõe.
 *
 * Ações:
 * - **Editar** → `PUT /users/:id`;
 * - **Desativar** → `DELETE /users/:id` (lógica, preserva o cadastro);
 * - **Reativar** → `PUT /users/:id` com `{ ativo: true }`.
 *
 * Para o próprio usuário autenticado, desativar/reativar não é oferecido: o
 * backend responde `403` e a interface evita um erro previsível.
 */
export default function UsuarioDetalheScreen() {
  return (
    <RoleGuard area="professor">
      <UsuarioDetalheConteudo />
    </RoleGuard>
  );
}

function UsuarioDetalheConteudo() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { usuario: usuarioAutenticado } = useAuth();

  const usuarioQuery = useUsuario(id);
  const desativar = useDesativarUsuario();
  const reativar = useReativarUsuario();

  const [confirmando, setConfirmando] = useState(false);
  const [mensagem, setMensagem] = useState<{ texto: string; tipo: 'sucesso' | 'erro' } | null>(
    null
  );

  const voltar = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/usuarios');
  };

  const confirmarDesativacao = () => {
    if (!id) return;

    setMensagem(null);
    desativar.mutate(id, {
      onSuccess: (resposta) => {
        setConfirmando(false);
        setMensagem({ texto: `${resposta.usuario.nome} foi desativado.`, tipo: 'sucesso' });
      },
      onError: (falha) => {
        setConfirmando(false);
        setMensagem({
          texto: traduzirErroUsuario(falha, 'desativar').mensagem,
          tipo: 'erro',
        });
      },
    });
  };

  const reativarUsuario = () => {
    if (!id) return;

    setMensagem(null);
    reativar.mutate(id, {
      onSuccess: (atualizado) =>
        setMensagem({ texto: `${atualizado.nome} foi reativado.`, tipo: 'sucesso' }),
      onError: (falha) =>
        setMensagem({ texto: traduzirErroUsuario(falha, 'reativar').mensagem, tipo: 'erro' }),
    });
  };

  const renderConteudo = (usuario: UsuarioPublico) => {
    const ehProprioUsuario = usuario._id === usuarioAutenticado?._id;
    const dataCriacao = formatarData(usuario.createdAt);
    const dataAtualizacao = formatarData(usuario.updatedAt);

    return (
      <ScrollView contentContainerStyle={styles.scroll} testID="usuario-detalhe">
        <View style={styles.cabecalho}>
          <Text style={styles.titulo} accessibilityRole="header">
            {usuario.nome}
          </Text>
          <Text style={styles.situacao}>
            {usuario.ativo ? 'Ativo' : 'Inativo'} · {rotuloPapel(usuario.role)}
          </Text>
        </View>

        {mensagem ? (
          <Banner
            message={mensagem.texto}
            variant={mensagem.tipo === 'erro' ? 'error' : 'success'}
            testID="usuario-detalhe-mensagem"
          />
        ) : null}

        <View style={styles.card}>
          <Campo rotulo="Nome" valor={usuario.nome} />
          <Campo rotulo="E-mail" valor={usuario.email} />
          <Campo rotulo="Papel" valor={rotuloPapel(usuario.role)} />
          <Campo rotulo="Situação" valor={usuario.ativo ? 'Ativo' : 'Inativo'} />
          {dataCriacao ? <Campo rotulo="Cadastrado em" valor={dataCriacao} /> : null}
          {dataAtualizacao ? <Campo rotulo="Última atualização" valor={dataAtualizacao} /> : null}
        </View>

        <View style={styles.acoes}>
          <Button
            label="Editar"
            testID="usuario-detalhe-editar"
            onPress={() => router.push(`/usuarios/${usuario._id}/editar`)}
          />

          {ehProprioUsuario ? (
            <Text style={styles.aviso}>
              Você está vendo a sua própria conta. Não é possível desativá-la ou alterar o próprio
              papel.
            </Text>
          ) : usuario.ativo ? (
            <Button
              label="Desativar usuário"
              variant="danger"
              testID="usuario-detalhe-desativar"
              onPress={() => setConfirmando(true)}
            />
          ) : (
            <Button
              label="Reativar usuário"
              testID="usuario-detalhe-reativar"
              onPress={reativarUsuario}
              loading={reativar.isPending}
            />
          )}
        </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.barra}>
        <Pressable
          onPress={voltar}
          accessibilityRole="button"
          accessibilityLabel="Voltar para a lista de usuários"
          style={styles.voltar}
        >
          <Text style={styles.voltarTexto}>‹ Voltar</Text>
        </Pressable>
      </View>

      {usuarioQuery.isPending ? (
        <LoadingState message="Carregando usuário…" testID="usuario-detalhe-carregando" />
      ) : usuarioQuery.isError ? (
        <ErrorState
          testID="usuario-detalhe-erro"
          title="Usuário indisponível"
          message={traduzirErroUsuario(usuarioQuery.error, 'detalhe').mensagem}
          onRetry={() => {
            void usuarioQuery.refetch();
          }}
        />
      ) : usuarioQuery.data ? (
        renderConteudo(usuarioQuery.data)
      ) : null}

      <ConfirmDialog
        visible={confirmando}
        testID="usuario-detalhe-confirmar-desativacao"
        title="Desativar usuário?"
        message="O usuário perderá o acesso ao aplicativo imediatamente. O cadastro é preservado e pode ser reativado depois."
        confirmLabel="Desativar"
        destructive
        loading={desativar.isPending}
        onConfirm={confirmarDesativacao}
        onCancel={() => setConfirmando(false)}
      />
    </SafeAreaView>
  );
}

function Campo({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <View style={styles.campo} accessible accessibilityLabel={`${rotulo}: ${valor}`}>
      <Text style={styles.campoRotulo}>{rotulo}</Text>
      <Text style={styles.campoValor}>{valor}</Text>
    </View>
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
  situacao: {
    ...typography.label,
    color: colors.chalkYellow,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.md,
  },
  campo: {
    gap: 2,
  },
  campoRotulo: {
    ...typography.caption,
    color: colors.mutedInk,
  },
  campoValor: {
    ...typography.body,
    color: colors.ink,
  },
  acoes: {
    gap: spacing.sm,
  },
  aviso: {
    ...typography.caption,
    color: colors.mutedInk,
  },
});
