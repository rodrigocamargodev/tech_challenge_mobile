import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { ApiError } from '@/core/http/ApiError';
import { clearToken } from '@/core/storage/secureTokenStorage';
import { renderComProviders } from '@/test/renderComProviders';

import CadastroScreen from '../../../app/(auth)/cadastro';

jest.mock('@/features/auth/authService', () => ({
  login: jest.fn(),
  cadastrarAluno: jest.fn(),
  buscarUsuarioAutenticado: jest.fn(),
}));

jest.mock('expo-router', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');

  return {
    Link: ({ children }: { children: React.ReactNode }) => React.createElement(Text, null, children),
    Redirect: () => null,
    useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
  };
});

// eslint-disable-next-line @typescript-eslint/no-require-imports
const authService = require('@/features/auth/authService') as {
  login: jest.Mock;
  cadastrarAluno: jest.Mock;
  buscarUsuarioAutenticado: jest.Mock;
};

const usuarioAluno = {
  _id: 'u1',
  nome: 'Maria Silva',
  email: 'maria@escola.com',
  role: 'aluno' as const,
  ativo: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const preencherCadastro = async (
  nome = 'Maria Silva',
  email = 'maria@escola.com',
  senha = 'senhaSegura123'
) => {
  await fireEvent.changeText(screen.getByTestId('cadastro-nome'), nome);
  await fireEvent.changeText(screen.getByTestId('cadastro-email'), email);
  await fireEvent.changeText(screen.getByTestId('cadastro-senha'), senha);
};

beforeEach(async () => {
  jest.clearAllMocks();
  await clearToken();
});

describe('tela de cadastro de aluno', () => {
  it('deixa claro que o cadastro público cria aluno', async () => {
    await renderComProviders(<CadastroScreen />);

    expect(screen.getByText(/cadastro público cria uma conta de aluno/i)).toBeOnTheScreen();
  });

  it('valida nome curto e senha curta antes de chamar a API', async () => {
    await renderComProviders(<CadastroScreen />);
    await preencherCadastro('M', 'maria@escola.com', '123');

    await fireEvent.press(screen.getByTestId('cadastro-submit'));

    await waitFor(() =>
      expect(screen.getByText('O nome deve ter no mínimo 2 caracteres.')).toBeOnTheScreen()
    );
    expect(screen.getByText('A senha deve ter no mínimo 8 caracteres.')).toBeOnTheScreen();
    expect(authService.cadastrarAluno).not.toHaveBeenCalled();
  });

  it('cadastra o aluno e abre a sessão automaticamente', async () => {
    authService.cadastrarAluno.mockResolvedValue({ usuario: usuarioAluno });
    authService.login.mockResolvedValue({ token: 'jwt', usuario: usuarioAluno });

    await renderComProviders(<CadastroScreen />);
    await preencherCadastro();
    await fireEvent.press(screen.getByTestId('cadastro-submit'));

    await waitFor(() =>
      expect(authService.cadastrarAluno).toHaveBeenCalledWith({
        nome: 'Maria Silva',
        email: 'maria@escola.com',
        senha: 'senhaSegura123',
      })
    );
    // O cadastro público não envia `role`.
    expect(authService.cadastrarAluno.mock.calls[0]?.[0]).not.toHaveProperty('role');
  });

  it('avisa quando a conta é criada mas o login automático falha', async () => {
    authService.cadastrarAluno.mockResolvedValue({ usuario: usuarioAluno });
    authService.login.mockRejectedValue(
      new ApiError({ kind: 'http', status: 429, message: 'Muitas tentativas.' })
    );

    await renderComProviders(<CadastroScreen />);
    await preencherCadastro();
    await fireEvent.press(screen.getByTestId('cadastro-submit'));

    await waitFor(() =>
      expect(screen.getByTestId('cadastro-aviso')).toHaveTextContent(/Conta criada com sucesso/i)
    );
  });

  it('exibe e-mail já cadastrado em 409', async () => {
    authService.cadastrarAluno.mockRejectedValue(
      new ApiError({
        kind: 'http',
        status: 409,
        message: 'Já existe um usuário cadastrado com este e-mail.',
      })
    );

    await renderComProviders(<CadastroScreen />);
    await preencherCadastro();
    await fireEvent.press(screen.getByTestId('cadastro-submit'));

    await waitFor(() =>
      expect(screen.getByTestId('cadastro-erro')).toHaveTextContent(/já existe/i)
    );
    expect(screen.getByText('Este e-mail já está em uso.')).toBeOnTheScreen();
  });

  it('associa detalhes de 422 aos campos do formulário', async () => {
    authService.cadastrarAluno.mockRejectedValue(
      new ApiError({
        kind: 'http',
        status: 422,
        message: 'Dados inválidos na requisição.',
        detalhes: [{ campo: 'senha', mensagem: 'A senha deve ter no máximo 72 caracteres.' }],
      })
    );

    await renderComProviders(<CadastroScreen />);
    await preencherCadastro();
    await fireEvent.press(screen.getByTestId('cadastro-submit'));

    await waitFor(() =>
      expect(screen.getByText('A senha deve ter no máximo 72 caracteres.')).toBeOnTheScreen()
    );
  });
});
