import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { ApiError } from '@/core/http/ApiError';
import { clearToken, saveToken } from '@/core/storage/secureTokenStorage';
import { usersKeys } from '@/features/users/queries';
import {
  alunoInativo,
  outroAluno,
  renderComProvidersUsuarios,
  usuarioAluno,
  usuarioProfessor,
} from '@/test/usuariosTestUtils';

import UsuariosScreen from '../../../app/(app)/usuarios/index';

jest.mock('@/features/auth/authService', () => ({
  login: jest.fn(),
  cadastrarAluno: jest.fn(),
  buscarUsuarioAutenticado: jest.fn(),
}));

jest.mock('@/features/users/usersService', () => ({
  listarUsuarios: jest.fn(),
  obterUsuario: jest.fn(),
  criarUsuario: jest.fn(),
  atualizarUsuario: jest.fn(),
  desativarUsuario: jest.fn(),
}));

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockRedirect = jest.fn();

jest.mock('expo-router', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');

  return {
    useRouter: () => ({
      push: mockPush,
      back: mockBack,
      replace: mockReplace,
      canGoBack: () => true,
    }),
    useLocalSearchParams: () => ({}),
    Redirect: ({ href }: { href: string }) => {
      mockRedirect(href);
      return React.createElement(Text, null, `redirect:${href}`);
    },
  };
});

// eslint-disable-next-line @typescript-eslint/no-require-imports
const authService = require('@/features/auth/authService') as {
  buscarUsuarioAutenticado: jest.Mock;
};
// eslint-disable-next-line @typescript-eslint/no-require-imports
const usersService = require('@/features/users/usersService') as {
  listarUsuarios: jest.Mock;
  desativarUsuario: jest.Mock;
  atualizarUsuario: jest.Mock;
};

const autenticarComo = async (usuario: typeof usuarioAluno | typeof usuarioProfessor) => {
  await saveToken('token');
  authService.buscarUsuarioAutenticado.mockResolvedValue({ usuario });
};

beforeEach(async () => {
  jest.clearAllMocks();
  await clearToken();
});

describe('gerenciamento de usuários — autorização', () => {
  it('bloqueia o aluno e redireciona para a home', async () => {
    await autenticarComo(usuarioAluno);

    await renderComProvidersUsuarios(<UsuariosScreen />);

    await waitFor(() => expect(mockRedirect).toHaveBeenCalledWith('/'));
    expect(screen.queryByTestId('usuarios-lista')).toBeNull();
    expect(screen.queryByTestId('usuarios-novo')).toBeNull();
    // A listagem nem é requisitada sem papel de professor.
    expect(usersService.listarUsuarios).not.toHaveBeenCalled();
  });

  it('permite o acesso do professor', async () => {
    await autenticarComo(usuarioProfessor);
    usersService.listarUsuarios.mockResolvedValue([usuarioProfessor, usuarioAluno]);

    await renderComProvidersUsuarios(<UsuariosScreen />);

    await waitFor(() => expect(screen.getByTestId('usuarios-lista')).toBeOnTheScreen());
    expect(screen.getByText('João Professor')).toBeOnTheScreen();
    expect(screen.getByText('Maria Silva')).toBeOnTheScreen();
    expect(mockRedirect).not.toHaveBeenCalled();
  });
});

describe('gerenciamento de usuários — listagem', () => {
  it('exibe estado de carregamento', async () => {
    await autenticarComo(usuarioProfessor);
    usersService.listarUsuarios.mockReturnValue(new Promise(() => {}));

    await renderComProvidersUsuarios(<UsuariosScreen />);

    await waitFor(() => expect(screen.getByTestId('usuarios-carregando')).toBeOnTheScreen());
  });

  it('mostra nome, e-mail, papel e situação', async () => {
    await autenticarComo(usuarioProfessor);
    usersService.listarUsuarios.mockResolvedValue([outroAluno, alunoInativo]);

    await renderComProvidersUsuarios(<UsuariosScreen />);

    await waitFor(() => expect(screen.getByText('Pedro Aluno')).toBeOnTheScreen());
    expect(screen.getByText('pedro@escola.com')).toBeOnTheScreen();
    // Os dois usuários são alunos, logo o papel aparece duas vezes.
    expect(screen.getAllByText('Aluno')).toHaveLength(2);
    expect(screen.getByText('Ativo')).toBeOnTheScreen();
    expect(screen.getByText('Ana Inativa')).toBeOnTheScreen();
    expect(screen.getByText('Inativo')).toBeOnTheScreen();
  });

  it('não envia filtro de papel quando "Todos" está selecionado', async () => {
    await autenticarComo(usuarioProfessor);
    usersService.listarUsuarios.mockResolvedValue([usuarioProfessor]);

    await renderComProvidersUsuarios(<UsuariosScreen />);

    await waitFor(() => expect(usersService.listarUsuarios).toHaveBeenCalled());
    expect(usersService.listarUsuarios).toHaveBeenCalledWith(
      expect.objectContaining({ papel: undefined, token: 'token' })
    );
  });

  it('aplica o filtro de papel no backend', async () => {
    await autenticarComo(usuarioProfessor);
    usersService.listarUsuarios.mockResolvedValue([usuarioProfessor, usuarioAluno]);

    await renderComProvidersUsuarios(<UsuariosScreen />);
    await waitFor(() => expect(screen.getByTestId('usuarios-lista')).toBeOnTheScreen());

    await fireEvent.press(screen.getByTestId('usuarios-filtro-papel-professor'));

    await waitFor(() =>
      expect(usersService.listarUsuarios).toHaveBeenCalledWith(
        expect.objectContaining({ papel: 'professor' })
      )
    );
  });

  it('filtra por nome localmente, sem nova requisição', async () => {
    await autenticarComo(usuarioProfessor);
    usersService.listarUsuarios.mockResolvedValue([usuarioProfessor, outroAluno]);

    await renderComProvidersUsuarios(<UsuariosScreen />);
    await waitFor(() => expect(screen.getByText('Pedro Aluno')).toBeOnTheScreen());
    const chamadasAposCarregar = usersService.listarUsuarios.mock.calls.length;

    await fireEvent.changeText(screen.getByTestId('usuarios-filtro-texto'), 'pedro');

    await waitFor(() => expect(screen.queryByText('João Professor')).toBeNull());
    expect(screen.getByText('Pedro Aluno')).toBeOnTheScreen();
    expect(usersService.listarUsuarios).toHaveBeenCalledTimes(chamadasAposCarregar);
  });

  it('mostra estado vazio específico quando o filtro local não encontra nada', async () => {
    await autenticarComo(usuarioProfessor);
    usersService.listarUsuarios.mockResolvedValue([usuarioProfessor]);

    await renderComProvidersUsuarios(<UsuariosScreen />);
    await waitFor(() => expect(screen.getByText('João Professor')).toBeOnTheScreen());

    await fireEvent.changeText(screen.getByTestId('usuarios-filtro-texto'), 'inexistente');

    await waitFor(() => expect(screen.getByTestId('usuarios-vazio-busca')).toBeOnTheScreen());

    await fireEvent.press(screen.getByTestId('usuarios-limpar-filtro'));
    await waitFor(() => expect(screen.getByText('João Professor')).toBeOnTheScreen());
  });

  it('mostra estado vazio orientativo quando não há usuários', async () => {
    await autenticarComo(usuarioProfessor);
    usersService.listarUsuarios.mockResolvedValue([]);

    await renderComProvidersUsuarios(<UsuariosScreen />);

    await waitFor(() => expect(screen.getByTestId('usuarios-vazio')).toBeOnTheScreen());
    expect(screen.getByText(/Cadastre o primeiro/i)).toBeOnTheScreen();
  });

  it('mostra estado de erro com nova tentativa', async () => {
    await autenticarComo(usuarioProfessor);
    usersService.listarUsuarios.mockRejectedValue(
      new ApiError({ kind: 'network', message: 'Sem conexão.' })
    );

    await renderComProvidersUsuarios(<UsuariosScreen />);

    await waitFor(() => expect(screen.getByTestId('usuarios-erro')).toBeOnTheScreen());
    expect(screen.getByText(/conectar ao servidor/i)).toBeOnTheScreen();
    expect(screen.getByTestId('usuarios-erro-retry')).toBeOnTheScreen();
  });

  it('trata 403 da API com mensagem de permissão', async () => {
    await autenticarComo(usuarioProfessor);
    usersService.listarUsuarios.mockRejectedValue(
      new ApiError({ kind: 'http', status: 403, message: 'Acesso negado.' })
    );

    await renderComProvidersUsuarios(<UsuariosScreen />);

    await waitFor(() => expect(screen.getByTestId('usuarios-erro')).toBeOnTheScreen());
    expect(screen.getByText(/não tem permissão/i)).toBeOnTheScreen();
  });

  it('navega para detalhe e edição', async () => {
    await autenticarComo(usuarioProfessor);
    usersService.listarUsuarios.mockResolvedValue([outroAluno]);

    await renderComProvidersUsuarios(<UsuariosScreen />);
    await waitFor(() => expect(screen.getByText('Pedro Aluno')).toBeOnTheScreen());

    await fireEvent.press(screen.getByLabelText('Abrir usuário: Pedro Aluno'));
    expect(mockPush).toHaveBeenCalledWith('/usuarios/u3');

    await fireEvent.press(screen.getByLabelText('Editar usuário: Pedro Aluno'));
    expect(mockPush).toHaveBeenCalledWith('/usuarios/u3/editar');

    await fireEvent.press(screen.getByTestId('usuarios-novo'));
    expect(mockPush).toHaveBeenCalledWith('/usuarios/novo');
  });
});

describe('gerenciamento de usuários — desativação', () => {
  it('pede confirmação antes de desativar', async () => {
    await autenticarComo(usuarioProfessor);
    usersService.listarUsuarios.mockResolvedValue([outroAluno]);

    await renderComProvidersUsuarios(<UsuariosScreen />);
    await waitFor(() => expect(screen.getByText('Pedro Aluno')).toBeOnTheScreen());

    await fireEvent.press(screen.getByLabelText('Desativar usuário: Pedro Aluno'));

    expect(screen.getByTestId('usuarios-confirmar-desativacao')).toBeOnTheScreen();
    expect(screen.getByText(/O cadastro é preservado/i)).toBeOnTheScreen();
    expect(usersService.desativarUsuario).not.toHaveBeenCalled();
  });

  it('cancela sem chamar a API', async () => {
    await autenticarComo(usuarioProfessor);
    usersService.listarUsuarios.mockResolvedValue([outroAluno]);

    await renderComProvidersUsuarios(<UsuariosScreen />);
    await waitFor(() => expect(screen.getByText('Pedro Aluno')).toBeOnTheScreen());

    await fireEvent.press(screen.getByLabelText('Desativar usuário: Pedro Aluno'));
    await fireEvent.press(screen.getByTestId('usuarios-confirmar-desativacao-cancelar'));

    expect(usersService.desativarUsuario).not.toHaveBeenCalled();
  });

  it('desativa após confirmação, atualiza o cache e informa o resultado', async () => {
    await autenticarComo(usuarioProfessor);
    usersService.listarUsuarios.mockResolvedValue([outroAluno]);
    usersService.desativarUsuario.mockResolvedValue({
      message: 'Usuário desativado com sucesso.',
      usuario: { ...outroAluno, ativo: false },
    });

    const { queryClient } = await renderComProvidersUsuarios(<UsuariosScreen />);
    await waitFor(() => expect(screen.getByText('Pedro Aluno')).toBeOnTheScreen());

    const invalidar = jest.spyOn(queryClient, 'invalidateQueries');

    await fireEvent.press(screen.getByLabelText('Desativar usuário: Pedro Aluno'));
    await fireEvent.press(screen.getByTestId('usuarios-confirmar-desativacao-confirmar'));

    await waitFor(() =>
      expect(usersService.desativarUsuario).toHaveBeenCalledWith('u3', 'token')
    );
    await waitFor(() => expect(invalidar).toHaveBeenCalledWith({ queryKey: usersKeys.all }));
    await waitFor(() => expect(screen.getByTestId('usuarios-mensagem')).toBeOnTheScreen());
    expect(screen.getByText(/Pedro Aluno foi desativado/i)).toBeOnTheScreen();
  });

  it('exibe o erro do backend quando a desativação falha', async () => {
    await autenticarComo(usuarioProfessor);
    usersService.listarUsuarios.mockResolvedValue([outroAluno]);
    usersService.desativarUsuario.mockRejectedValue(
      new ApiError({
        kind: 'http',
        status: 403,
        message: 'Você não pode desativar o seu próprio usuário.',
      })
    );

    await renderComProvidersUsuarios(<UsuariosScreen />);
    await waitFor(() => expect(screen.getByText('Pedro Aluno')).toBeOnTheScreen());

    await fireEvent.press(screen.getByLabelText('Desativar usuário: Pedro Aluno'));
    await fireEvent.press(screen.getByTestId('usuarios-confirmar-desativacao-confirmar'));

    await waitFor(() =>
      expect(screen.getByText(/não pode desativar o seu próprio usuário/i)).toBeOnTheScreen()
    );
  });

  it('não oferece desativar para o próprio professor logado', async () => {
    await autenticarComo(usuarioProfessor);
    usersService.listarUsuarios.mockResolvedValue([usuarioProfessor, outroAluno]);

    await renderComProvidersUsuarios(<UsuariosScreen />);
    await waitFor(() => expect(screen.getByText('João Professor')).toBeOnTheScreen());

    expect(screen.queryByLabelText('Desativar usuário: João Professor')).toBeNull();
    expect(screen.getByLabelText('Desativar usuário: Pedro Aluno')).toBeOnTheScreen();
  });

  it('reativa um usuário inativo via PUT com ativo: true', async () => {
    await autenticarComo(usuarioProfessor);
    usersService.listarUsuarios.mockResolvedValue([alunoInativo]);
    usersService.atualizarUsuario.mockResolvedValue({ ...alunoInativo, ativo: true });

    const { queryClient } = await renderComProvidersUsuarios(<UsuariosScreen />);
    await waitFor(() => expect(screen.getByText('Ana Inativa')).toBeOnTheScreen());

    const invalidar = jest.spyOn(queryClient, 'invalidateQueries');

    await fireEvent.press(screen.getByLabelText('Reativar usuário: Ana Inativa'));

    await waitFor(() =>
      expect(usersService.atualizarUsuario).toHaveBeenCalledWith('u4', { ativo: true }, 'token')
    );
    await waitFor(() => expect(invalidar).toHaveBeenCalledWith({ queryKey: usersKeys.all }));
    await waitFor(() => expect(screen.getByText(/Ana Inativa foi reativado/i)).toBeOnTheScreen());
  });

  it('não exibe "Desativar" para usuário inativo (apenas "Reativar")', async () => {
    await autenticarComo(usuarioProfessor);
    usersService.listarUsuarios.mockResolvedValue([alunoInativo]);

    await renderComProvidersUsuarios(<UsuariosScreen />);
    await waitFor(() => expect(screen.getByText('Ana Inativa')).toBeOnTheScreen());

    // Um usuário já inativo não deve oferecer a ação de desativar.
    expect(screen.queryByLabelText('Desativar usuário: Ana Inativa')).toBeNull();
    expect(screen.getByLabelText('Reativar usuário: Ana Inativa')).toBeOnTheScreen();
  });

  it('exibe a mensagem de erro com variante de erro quando a desativação falha', async () => {
    await autenticarComo(usuarioProfessor);
    usersService.listarUsuarios.mockResolvedValue([outroAluno]);
    usersService.desativarUsuario.mockRejectedValue(
      new ApiError({ kind: 'http', status: 500, message: 'Erro interno.' })
    );

    await renderComProvidersUsuarios(<UsuariosScreen />);
    await waitFor(() => expect(screen.getByText('Pedro Aluno')).toBeOnTheScreen());

    await fireEvent.press(screen.getByLabelText('Desativar usuário: Pedro Aluno'));
    await fireEvent.press(screen.getByTestId('usuarios-confirmar-desativacao-confirmar'));

    const banner = await screen.findByTestId('usuarios-mensagem');
    // O banner de erro é anunciado como alerta (não como texto informativo).
    expect(banner.props.accessibilityRole).toBe('alert');
  });

  it('usa o plural correto no texto do filtro de papel', async () => {
    await autenticarComo(usuarioProfessor);
    usersService.listarUsuarios.mockResolvedValue([usuarioProfessor]);

    await renderComProvidersUsuarios(<UsuariosScreen />);
    await waitFor(() => expect(screen.getByTestId('usuarios-lista')).toBeOnTheScreen());

    await fireEvent.press(screen.getByTestId('usuarios-filtro-papel-professor'));

    await waitFor(() => expect(screen.getByText(/Exibindo: professores\./)).toBeOnTheScreen());
    expect(screen.queryByText(/professors/)).toBeNull();
  });
});
