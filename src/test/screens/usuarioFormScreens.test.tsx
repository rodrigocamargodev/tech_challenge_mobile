import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { ApiError } from '@/core/http/ApiError';
import { clearToken, saveToken } from '@/core/storage/secureTokenStorage';
import { usersKeys } from '@/features/users/queries';
import {
  outroAluno,
  renderComProvidersUsuarios,
  usuarioAluno,
  usuarioProfessor,
} from '@/test/usuariosTestUtils';

import EditarUsuarioScreen from '../../../app/(app)/usuarios/[id]/editar';
import NovoUsuarioScreen from '../../../app/(app)/usuarios/novo';

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
let mockParametrosRota: { id?: string } = { id: 'u3' };

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
  criarUsuario: jest.Mock;
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

describe('cadastro de usuário (professor)', () => {
  it('bloqueia o aluno e redireciona para a home', async () => {
    await autenticarComo(usuarioAluno);

    await renderComProvidersUsuarios(<NovoUsuarioScreen />);

    await waitFor(() => expect(mockRedirect).toHaveBeenCalledWith('/'));
    expect(screen.queryByTestId('usuario-nome')).toBeNull();
  });

  it('valida os campos antes de chamar a API', async () => {
    await autenticarComo(usuarioProfessor);

    await renderComProvidersUsuarios(<NovoUsuarioScreen />);
    await waitFor(() => expect(screen.getByTestId('usuario-nome')).toBeOnTheScreen());

    await fireEvent.press(screen.getByTestId('usuario-submit'));

    await waitFor(() =>
      expect(screen.getByText('O nome deve ter no mínimo 2 caracteres.')).toBeOnTheScreen()
    );
    expect(screen.getByText('Informe o e-mail.')).toBeOnTheScreen();
    expect(screen.getByText('A senha deve ter no mínimo 8 caracteres.')).toBeOnTheScreen();
    expect(usersService.criarUsuario).not.toHaveBeenCalled();
  });

  it('rejeita senha com menos de 8 caracteres', async () => {
    await autenticarComo(usuarioProfessor);

    await renderComProvidersUsuarios(<NovoUsuarioScreen />);
    await waitFor(() => expect(screen.getByTestId('usuario-nome')).toBeOnTheScreen());

    await fireEvent.changeText(screen.getByTestId('usuario-nome'), 'Pedro Aluno');
    await fireEvent.changeText(screen.getByTestId('usuario-email'), 'pedro@escola.com');
    await fireEvent.changeText(screen.getByTestId('usuario-senha'), 'curta');
    await fireEvent.press(screen.getByTestId('usuario-submit'));

    await waitFor(() =>
      expect(screen.getByText('A senha deve ter no mínimo 8 caracteres.')).toBeOnTheScreen()
    );
    expect(usersService.criarUsuario).not.toHaveBeenCalled();
  });

  it('cria um aluno por padrão e invalida o cache', async () => {
    await autenticarComo(usuarioProfessor);
    usersService.criarUsuario.mockResolvedValue(outroAluno);

    const { queryClient } = await renderComProvidersUsuarios(<NovoUsuarioScreen />);
    await waitFor(() => expect(screen.getByTestId('usuario-nome')).toBeOnTheScreen());

    const invalidar = jest.spyOn(queryClient, 'invalidateQueries');

    await fireEvent.changeText(screen.getByTestId('usuario-nome'), 'Pedro Aluno');
    await fireEvent.changeText(screen.getByTestId('usuario-email'), 'pedro@escola.com');
    await fireEvent.changeText(screen.getByTestId('usuario-senha'), 'senhaSegura123');
    await fireEvent.press(screen.getByTestId('usuario-submit'));

    await waitFor(() =>
      expect(usersService.criarUsuario).toHaveBeenCalledWith(
        {
          nome: 'Pedro Aluno',
          email: 'pedro@escola.com',
          senha: 'senhaSegura123',
          role: 'aluno',
        },
        'token'
      )
    );
    await waitFor(() => expect(invalidar).toHaveBeenCalledWith({ queryKey: usersKeys.all }));
    await waitFor(() => expect(mockBack).toHaveBeenCalled());
  });

  it('cria um professor quando o papel é selecionado', async () => {
    await autenticarComo(usuarioProfessor);
    usersService.criarUsuario.mockResolvedValue({ ...outroAluno, role: 'professor' });

    await renderComProvidersUsuarios(<NovoUsuarioScreen />);
    await waitFor(() => expect(screen.getByTestId('usuario-nome')).toBeOnTheScreen());

    await fireEvent.changeText(screen.getByTestId('usuario-nome'), 'Novo Professor');
    await fireEvent.changeText(screen.getByTestId('usuario-email'), 'novo@escola.com');
    await fireEvent.changeText(screen.getByTestId('usuario-senha'), 'senhaSegura123');
    await fireEvent.press(screen.getByTestId('usuario-papel-professor'));
    await fireEvent.press(screen.getByTestId('usuario-submit'));

    await waitFor(() =>
      expect(usersService.criarUsuario).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'professor' }),
        'token'
      )
    );
  });

  it('associa o 409 de e-mail duplicado ao campo', async () => {
    await autenticarComo(usuarioProfessor);
    usersService.criarUsuario.mockRejectedValue(
      new ApiError({
        kind: 'http',
        status: 409,
        message: 'Já existe um usuário cadastrado com este e-mail.',
      })
    );

    await renderComProvidersUsuarios(<NovoUsuarioScreen />);
    await waitFor(() => expect(screen.getByTestId('usuario-nome')).toBeOnTheScreen());

    await fireEvent.changeText(screen.getByTestId('usuario-nome'), 'Pedro Aluno');
    await fireEvent.changeText(screen.getByTestId('usuario-email'), 'pedro@escola.com');
    await fireEvent.changeText(screen.getByTestId('usuario-senha'), 'senhaSegura123');
    await fireEvent.press(screen.getByTestId('usuario-submit'));

    await waitFor(() => expect(screen.getByTestId('usuario-novo-erro')).toBeOnTheScreen());
    expect(screen.getByText('Este e-mail já está em uso.')).toBeOnTheScreen();
  });

  it('associa erros 422 do backend aos campos', async () => {
    await autenticarComo(usuarioProfessor);
    usersService.criarUsuario.mockRejectedValue(
      new ApiError({
        kind: 'http',
        status: 422,
        message: 'Dados inválidos na requisição.',
        detalhes: [{ campo: 'nome', mensagem: 'Nome inválido para o cadastro.' }],
      })
    );

    await renderComProvidersUsuarios(<NovoUsuarioScreen />);
    await waitFor(() => expect(screen.getByTestId('usuario-nome')).toBeOnTheScreen());

    await fireEvent.changeText(screen.getByTestId('usuario-nome'), 'Pedro Aluno');
    await fireEvent.changeText(screen.getByTestId('usuario-email'), 'pedro@escola.com');
    await fireEvent.changeText(screen.getByTestId('usuario-senha'), 'senhaSegura123');
    await fireEvent.press(screen.getByTestId('usuario-submit'));

    await waitFor(() =>
      expect(screen.getByText('Nome inválido para o cadastro.')).toBeOnTheScreen()
    );
  });
});

describe('edição de usuário (professor)', () => {
  it('bloqueia o aluno e redireciona para a home', async () => {
    await autenticarComo(usuarioAluno);

    await renderComProvidersUsuarios(<EditarUsuarioScreen />);

    await waitFor(() => expect(mockRedirect).toHaveBeenCalledWith('/'));
    expect(usersService.obterUsuario).not.toHaveBeenCalled();
  });

  it('carrega os dados atuais no formulário', async () => {
    await autenticarComo(usuarioProfessor);
    usersService.obterUsuario.mockResolvedValue(outroAluno);

    await renderComProvidersUsuarios(<EditarUsuarioScreen />);

    await waitFor(() => expect(screen.getByTestId('usuario-nome')).toBeOnTheScreen());
    expect(screen.getByTestId('usuario-nome').props.value).toBe('Pedro Aluno');
    expect(screen.getByTestId('usuario-email').props.value).toBe('pedro@escola.com');
    // A senha nunca vem preenchida.
    expect(screen.getByTestId('usuario-senha').props.value).toBe('');
  });

  it('envia somente nome e e-mail quando a senha fica vazia', async () => {
    await autenticarComo(usuarioProfessor);
    usersService.obterUsuario.mockResolvedValue(outroAluno);
    usersService.atualizarUsuario.mockResolvedValue({ ...outroAluno, nome: 'Pedro Atualizado' });

    const { queryClient } = await renderComProvidersUsuarios(<EditarUsuarioScreen />);
    await waitFor(() => expect(screen.getByTestId('usuario-nome')).toBeOnTheScreen());

    const invalidar = jest.spyOn(queryClient, 'invalidateQueries');

    await fireEvent.changeText(screen.getByTestId('usuario-nome'), 'Pedro Atualizado');
    await fireEvent.press(screen.getByTestId('usuario-submit'));

    await waitFor(() =>
      expect(usersService.atualizarUsuario).toHaveBeenCalledWith(
        'u3',
        { nome: 'Pedro Atualizado', email: 'pedro@escola.com', role: 'aluno' },
        'token'
      )
    );
    await waitFor(() => expect(invalidar).toHaveBeenCalledWith({ queryKey: usersKeys.all }));
    await waitFor(() => expect(mockBack).toHaveBeenCalled());
  });

  it('envia a nova senha quando informada', async () => {
    await autenticarComo(usuarioProfessor);
    usersService.obterUsuario.mockResolvedValue(outroAluno);
    usersService.atualizarUsuario.mockResolvedValue(outroAluno);

    await renderComProvidersUsuarios(<EditarUsuarioScreen />);
    await waitFor(() => expect(screen.getByTestId('usuario-senha')).toBeOnTheScreen());

    await fireEvent.changeText(screen.getByTestId('usuario-senha'), 'novaSenha123');
    await fireEvent.press(screen.getByTestId('usuario-submit'));

    await waitFor(() =>
      expect(usersService.atualizarUsuario).toHaveBeenCalledWith(
        'u3',
        expect.objectContaining({ senha: 'novaSenha123' }),
        'token'
      )
    );
  });

  it('permite promover um aluno a professor', async () => {
    await autenticarComo(usuarioProfessor);
    usersService.obterUsuario.mockResolvedValue(outroAluno);
    usersService.atualizarUsuario.mockResolvedValue({ ...outroAluno, role: 'professor' });

    await renderComProvidersUsuarios(<EditarUsuarioScreen />);
    await waitFor(() => expect(screen.getByTestId('usuario-papel-professor')).toBeOnTheScreen());

    await fireEvent.press(screen.getByTestId('usuario-papel-professor'));
    await fireEvent.press(screen.getByTestId('usuario-submit'));

    await waitFor(() =>
      expect(usersService.atualizarUsuario).toHaveBeenCalledWith(
        'u3',
        expect.objectContaining({ role: 'professor' }),
        'token'
      )
    );
  });

  it('trava o papel ao editar a própria conta', async () => {
    mockParametrosRota = { id: 'u2' };
    await autenticarComo(usuarioProfessor);
    usersService.obterUsuario.mockResolvedValue(usuarioProfessor);

    await renderComProvidersUsuarios(<EditarUsuarioScreen />);

    await waitFor(() => expect(screen.getByTestId('usuario-papel-professor')).toBeOnTheScreen());
    expect(screen.getByText(/não pode alterar o seu próprio papel/i)).toBeOnTheScreen();
    expect(screen.getByTestId('usuario-papel-professor').props.accessibilityState).toMatchObject({
      disabled: true,
    });
  });

  it('exibe o erro de regra de negócio devolvido pelo backend', async () => {
    await autenticarComo(usuarioProfessor);
    usersService.obterUsuario.mockResolvedValue(outroAluno);
    usersService.atualizarUsuario.mockRejectedValue(
      new ApiError({
        kind: 'http',
        status: 403,
        message: 'Você não pode alterar o seu próprio papel.',
      })
    );

    await renderComProvidersUsuarios(<EditarUsuarioScreen />);
    await waitFor(() => expect(screen.getByTestId('usuario-nome')).toBeOnTheScreen());

    await fireEvent.press(screen.getByTestId('usuario-papel-professor'));
    await fireEvent.press(screen.getByTestId('usuario-submit'));

    await waitFor(() =>
      expect(screen.getByText(/não pode alterar o seu próprio papel/i)).toBeOnTheScreen()
    );
  });
});
