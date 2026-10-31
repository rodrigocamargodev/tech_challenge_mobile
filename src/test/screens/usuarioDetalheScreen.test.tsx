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

import UsuarioDetalheScreen from '../../../app/(app)/usuarios/[id]';

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
const mockRedirect = jest.fn();
let mockParametrosRota: { id: string } = { id: 'u3' };

jest.mock('expo-router', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');

  return {
    useRouter: () => ({
      push: mockPush,
      back: mockBack,
      replace: jest.fn(),
      canGoBack: () => true,
    }),
    useLocalSearchParams: () => mockParametrosRota,
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
  obterUsuario: jest.Mock;
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
  mockParametrosRota = { id: 'u3' };
});

describe('detalhe de usuário — autorização', () => {
  it('bloqueia o aluno e redireciona para a home', async () => {
    await autenticarComo(usuarioAluno);

    await renderComProvidersUsuarios(<UsuarioDetalheScreen />);

    await waitFor(() => expect(mockRedirect).toHaveBeenCalledWith('/'));
    expect(usersService.obterUsuario).not.toHaveBeenCalled();
  });
});

describe('detalhe de usuário', () => {
  it('exibe estado de carregamento', async () => {
    await autenticarComo(usuarioProfessor);
    usersService.obterUsuario.mockReturnValue(new Promise(() => {}));

    await renderComProvidersUsuarios(<UsuarioDetalheScreen />);

    await waitFor(() =>
      expect(screen.getByTestId('usuario-detalhe-carregando')).toBeOnTheScreen()
    );
  });

  it('exibe os dados públicos do usuário', async () => {
    await autenticarComo(usuarioProfessor);
    usersService.obterUsuario.mockResolvedValue(outroAluno);

    await renderComProvidersUsuarios(<UsuarioDetalheScreen />);

    // O nome aparece no cabeçalho e no campo "Nome".
    await waitFor(() => expect(screen.getAllByText('Pedro Aluno').length).toBeGreaterThan(0));
    expect(screen.getByText('pedro@escola.com')).toBeOnTheScreen();
    expect(screen.getByText('Ativo · Aluno')).toBeOnTheScreen();
    expect(usersService.obterUsuario).toHaveBeenCalledWith('u3', 'token', expect.anything());
    // Nunca há senha/hash na tela.
    expect(screen.queryByText(/senha/i)).toBeNull();
  });

  it('exibe erro 404 com mensagem específica', async () => {
    await autenticarComo(usuarioProfessor);
    usersService.obterUsuario.mockRejectedValue(
      new ApiError({ kind: 'http', status: 404, message: 'Usuário não encontrado.' })
    );

    await renderComProvidersUsuarios(<UsuarioDetalheScreen />);

    await waitFor(() => expect(screen.getByTestId('usuario-detalhe-erro')).toBeOnTheScreen());
    expect(screen.getByText(/não existe mais/i)).toBeOnTheScreen();
  });

  it('navega para a edição', async () => {
    await autenticarComo(usuarioProfessor);
    usersService.obterUsuario.mockResolvedValue(outroAluno);

    await renderComProvidersUsuarios(<UsuarioDetalheScreen />);
    await waitFor(() => expect(screen.getByTestId('usuario-detalhe-editar')).toBeOnTheScreen());

    await fireEvent.press(screen.getByTestId('usuario-detalhe-editar'));

    expect(mockPush).toHaveBeenCalledWith('/usuarios/u3/editar');
  });

  it('pede confirmação e desativa o usuário', async () => {
    await autenticarComo(usuarioProfessor);
    // Primeira leitura: usuário ativo. Após a desativação, o refetch devolve o
    // usuário já inativo (comportamento real do backend).
    usersService.obterUsuario
      .mockResolvedValueOnce(outroAluno)
      .mockResolvedValue({ ...outroAluno, ativo: false });
    usersService.desativarUsuario.mockResolvedValue({
      message: 'Usuário desativado com sucesso.',
      usuario: { ...outroAluno, ativo: false },
    });

    const { queryClient } = await renderComProvidersUsuarios(<UsuarioDetalheScreen />);
    await waitFor(() => expect(screen.getByTestId('usuario-detalhe-desativar')).toBeOnTheScreen());

    const invalidar = jest.spyOn(queryClient, 'invalidateQueries');

    await fireEvent.press(screen.getByTestId('usuario-detalhe-desativar'));
    expect(usersService.desativarUsuario).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByTestId('usuario-detalhe-confirmar-desativacao-confirmar'));

    await waitFor(() =>
      expect(usersService.desativarUsuario).toHaveBeenCalledWith('u3', 'token')
    );
    await waitFor(() => expect(invalidar).toHaveBeenCalledWith({ queryKey: usersKeys.all }));
    // O detalhe em cache já reflete a desativação.
    await waitFor(() =>
      expect(queryClient.getQueryData(usersKeys.detalhe('u3'))).toMatchObject({ ativo: false })
    );
  });

  it('exibe o erro do backend ao tentar desativar a própria conta', async () => {
    mockParametrosRota = { id: 'u2' };
    await autenticarComo(usuarioProfessor);
    usersService.obterUsuario.mockResolvedValue(usuarioProfessor);

    await renderComProvidersUsuarios(<UsuarioDetalheScreen />);

    // O nome aparece no cabeçalho e no campo "Nome".
    await waitFor(() => expect(screen.getAllByText('João Professor').length).toBeGreaterThan(0));
    // A ação não é oferecida para o próprio usuário.
    expect(screen.queryByTestId('usuario-detalhe-desativar')).toBeNull();
    expect(screen.getByText(/sua própria conta/i)).toBeOnTheScreen();
    expect(screen.getByTestId('usuario-detalhe-editar')).toBeOnTheScreen();
  });

  it('reativa um usuário inativo', async () => {
    mockParametrosRota = { id: 'u4' };
    await autenticarComo(usuarioProfessor);
    usersService.obterUsuario.mockResolvedValue(alunoInativo);
    usersService.atualizarUsuario.mockResolvedValue({ ...alunoInativo, ativo: true });

    await renderComProvidersUsuarios(<UsuarioDetalheScreen />);
    await waitFor(() => expect(screen.getByTestId('usuario-detalhe-reativar')).toBeOnTheScreen());

    await fireEvent.press(screen.getByTestId('usuario-detalhe-reativar'));

    await waitFor(() =>
      expect(usersService.atualizarUsuario).toHaveBeenCalledWith('u4', { ativo: true }, 'token')
    );
    await waitFor(() =>
      expect(screen.getByText(/Ana Inativa foi reativado/i)).toBeOnTheScreen()
    );
  });

  it('trata 403 ao desativar com mensagem de regra de negócio', async () => {
    await autenticarComo(usuarioProfessor);
    usersService.obterUsuario.mockResolvedValue(outroAluno);
    usersService.desativarUsuario.mockRejectedValue(
      new ApiError({
        kind: 'http',
        status: 403,
        message: 'Você não pode desativar o seu próprio usuário.',
      })
    );

    await renderComProvidersUsuarios(<UsuarioDetalheScreen />);
    await waitFor(() => expect(screen.getByTestId('usuario-detalhe-desativar')).toBeOnTheScreen());

    await fireEvent.press(screen.getByTestId('usuario-detalhe-desativar'));
    await fireEvent.press(screen.getByTestId('usuario-detalhe-confirmar-desativacao-confirmar'));

    await waitFor(() =>
      expect(screen.getByText(/não pode desativar o seu próprio usuário/i)).toBeOnTheScreen()
    );
  });
});
