import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, minTouchTarget, radius, spacing, typography } from '@/core/theme/tokens';
import { useAuth } from '@/features/auth/AuthContext';
import { RoleGuard } from '@/features/auth/components/RoleGuard';
import { OptionGroup } from '@/shared/components/OptionGroup';
import { UserCard } from '@/features/users/components/UserCard';
import { useDesativarUsuario, useListarUsuarios, useReativarUsuario } from '@/features/users/queries';
import { rotuloPapelPlural } from '@/features/users/schemas';
import type { Papel, UsuarioPublico } from '@/features/users/types';
import { traduzirErroUsuario } from '@/features/users/userErrors';
import { Banner } from '@/shared/components/Banner';
import { Button } from '@/shared/components/Button';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { EmptyState } from '@/shared/components/EmptyState';
import { ErrorState } from '@/shared/components/ErrorState';
import { ScreenHeader } from '@/shared/components/ScreenHeader';
import { TextField } from '@/shared/components/TextField';

type FiltroPapel = 'todos' | Papel;

const opcoesFiltro: { value: FiltroPapel; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'professor', label: 'Professores' },
  { value: 'aluno', label: 'Alunos' },
];

/**
 * Gerenciamento de usuários — exclusivo de professor.
 *
 * Protegida por `RoleGuard area="professor"`: um aluno é redirecionado antes de
 * qualquer renderização. O backend também responde `403` em todas as rotas
 * `/users` para quem não é professor.
 *
 * Filtros:
 * - **papel**: aplicado pelo backend (`GET /users?role=`), que é o único filtro
 *   suportado pela API;
 * - **texto**: filtro local sobre a lista já carregada. A API não oferece busca
 *   de usuários e a listagem não tem paginação, então a lista recebida é
 *   completa — filtrar no cliente não omite resultados.
 */
export default function UsuariosScreen() {
  return (
    <RoleGuard area="professor">
      <UsuariosConteudo />
    </RoleGuard>
  );
}

function UsuariosConteudo() {
  const router = useRouter();
  const { usuario } = useAuth();

  const [papel, setPapel] = useState<FiltroPapel>('todos');
  const [termo, setTermo] = useState('');

  const listaQuery = useListarUsuarios(papel === 'todos' ? undefined : papel);

  const desativar = useDesativarUsuario();
  const reativar = useReativarUsuario();

  const [usuarioParaDesativar, setUsuarioParaDesativar] = useState<UsuarioPublico | null>(null);
  const [mensagem, setMensagem] = useState<{ texto: string; tipo: 'sucesso' | 'erro' } | null>(
    null
  );

  const usuarios = useMemo<UsuarioPublico[]>(() => {
    const lista = listaQuery.data ?? [];
    const busca = termo.trim().toLowerCase();

    if (busca === '') return lista;

    return lista.filter(
      (item) =>
        item.nome.toLowerCase().includes(busca) || item.email.toLowerCase().includes(busca)
    );
  }, [listaQuery.data, termo]);

  const erro = listaQuery.error ? traduzirErroUsuario(listaQuery.error, 'lista') : null;
  const mutacaoEmCurso = desativar.isPending || reativar.isPending;

  const confirmarDesativacao = () => {
    if (!usuarioParaDesativar) return;

    setMensagem(null);
    desativar.mutate(usuarioParaDesativar._id, {
      onSuccess: (resposta) => {
        setUsuarioParaDesativar(null);
        setMensagem({ texto: `${resposta.usuario.nome} foi desativado.`, tipo: 'sucesso' });
      },
      onError: (falha) => {
        setUsuarioParaDesativar(null);
        setMensagem({
          texto: traduzirErroUsuario(falha, 'desativar').mensagem,
          tipo: 'erro',
        });
      },
    });
  };

  const reativarUsuario = (alvo: UsuarioPublico) => {
    setMensagem(null);
    reativar.mutate(alvo._id, {
      onSuccess: (atualizado) =>
        setMensagem({ texto: `${atualizado.nome} foi reativado.`, tipo: 'sucesso' }),
      onError: (falha) =>
        setMensagem({ texto: traduzirErroUsuario(falha, 'reativar').mensagem, tipo: 'erro' }),
    });
  };

  const renderConteudo = () => {
    if (listaQuery.isPending) {
      return (
        <View style={styles.estado} testID="usuarios-carregando">
          <Text style={styles.estadoTexto}>Carregando usuários…</Text>
        </View>
      );
    }

    if (erro) {
      return (
        <ErrorState
          testID="usuarios-erro"
          title="Não foi possível carregar"
          message={erro.mensagem}
          onRetry={() => {
            void listaQuery.refetch();
          }}
        />
      );
    }

    if (usuarios.length === 0) {
      const filtrando = termo.trim() !== '';

      return filtrando ? (
        <EmptyState
          testID="usuarios-vazio-busca"
          title="Nenhum usuário encontrado"
          message={`Não encontramos usuários com “${termo.trim()}”. Tente outro nome ou e-mail.`}
          action={
            <Button
              label="Limpar filtro"
              variant="secondary"
              testID="usuarios-limpar-filtro"
              onPress={() => setTermo('')}
            />
          }
        />
      ) : (
        <EmptyState
          testID="usuarios-vazio"
          title="Nenhum usuário cadastrado"
          message={
            papel === 'todos'
              ? 'Cadastre o primeiro professor ou aluno usando o botão acima.'
              : `Não há ${papel === 'professor' ? 'professores' : 'alunos'} cadastrados.`
          }
        />
      );
    }

    return (
      <FlatList
        testID="usuarios-lista"
        data={usuarios}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listaConteudo}
        ItemSeparatorComponent={() => <View style={styles.separador} />}
        refreshControl={
          <RefreshControl
            refreshing={listaQuery.isRefetching}
            onRefresh={() => {
              void listaQuery.refetch();
            }}
            tintColor={colors.chalkboardRaised}
          />
        }
        renderItem={({ item }) => {
          const ehProprioUsuario = item._id === usuario?._id;

          return (
            <UserCard
              usuario={item}
              onPress={() => router.push(`/usuarios/${item._id}`)}
              onEditar={() => router.push(`/usuarios/${item._id}/editar`)}
              // O backend bloqueia desativar a própria conta (403); a interface
              // nem oferece a ação.
              onDesativar={ehProprioUsuario ? undefined : () => setUsuarioParaDesativar(item)}
              onReativar={ehProprioUsuario ? undefined : () => reativarUsuario(item)}
              processando={
                (desativar.isPending && desativar.variables === item._id) ||
                (reativar.isPending && reativar.variables === item._id)
              }
              acoesBloqueadas={mutacaoEmCurso}
            />
          );
        }}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.cabecalho}>
        <ScreenHeader
          title="Usuários"
          subtitle="Professores e alunos"
          action={
            <Button
              label="Novo"
              testID="usuarios-novo"
              onPress={() => router.push('/usuarios/novo')}
              accessibilityHint="Abre o formulário de novo usuário"
            />
          }
        />

        <Button
          label="‹ Voltar"
          variant="secondary"
          testID="usuarios-voltar"
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
              return;
            }
            router.replace('/');
          }}
        />

        <OptionGroup
          label="Filtrar por papel"
          testID="usuarios-filtro-papel"
          options={opcoesFiltro}
          value={papel}
          onChange={setPapel}
          hint={`Filtro aplicado pelo servidor. Exibindo: ${
            papel === 'todos' ? 'todos os papéis' : rotuloPapelPlural(papel)
          }.`}
        />

        <TextField
          label="Filtrar por nome ou e-mail"
          testID="usuarios-filtro-texto"
          value={termo}
          onChangeText={setTermo}
          placeholder="Digite parte do nome ou e-mail…"
          autoCapitalize="none"
          autoCorrect={false}
          hint="Filtro local sobre a lista já carregada. A API não oferece busca de usuários."
        />

        {termo.length > 0 ? (
          <Pressable
            onPress={() => setTermo('')}
            accessibilityRole="button"
            accessibilityLabel="Limpar filtro de texto"
            style={styles.limpar}
          >
            <Text style={styles.limparTexto}>Limpar filtro</Text>
          </Pressable>
        ) : null}

        {mensagem ? (
          <Banner
            message={mensagem.texto}
            variant={mensagem.tipo === 'erro' ? 'error' : 'success'}
            testID="usuarios-mensagem"
          />
        ) : null}
      </View>

      <View style={styles.conteudo}>{renderConteudo()}</View>

      <ConfirmDialog
        visible={usuarioParaDesativar !== null}
        testID="usuarios-confirmar-desativacao"
        title="Desativar usuário?"
        message={
          usuarioParaDesativar
            ? `${usuarioParaDesativar.nome} perderá o acesso ao aplicativo imediatamente. O cadastro é preservado e pode ser reativado depois.`
            : ''
        }
        confirmLabel="Desativar"
        destructive
        loading={desativar.isPending}
        onConfirm={confirmarDesativacao}
        onCancel={() => setUsuarioParaDesativar(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  cabecalho: {
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
});
