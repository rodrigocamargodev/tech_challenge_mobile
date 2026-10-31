import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { ApiError } from '@/core/http/ApiError';
import { clearToken } from '@/core/storage/secureTokenStorage';
import { renderComProviders } from '@/test/renderComProviders';

import LoginScreen from '../../../app/(auth)/login';

jest.mock('@/features/auth/authService', () => ({
  login: jest.fn(),
  cadastrarAluno: jest.fn(),
  buscarUsuarioAutenticado: jest.fn(),
}));

// `Link` depende do container de navegação; nos testes de tela ele é um texto.
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

const preencherLogin = async (email = 'maria@escola.com', senha = 'senhaSegura123') => {
  await fireEvent.changeText(screen.getByTestId('login-email'), email);
  await fireEvent.changeText(screen.getByTestId('login-senha'), senha);
};

beforeEach(async () => {
  jest.clearAllMocks();
  await clearToken();
});

describe('tela de login', () => {
  it('renderiza campos acessíveis e o botão de entrada', async () => {
    await renderComProviders(<LoginScreen />);

    expect(screen.getByLabelText('E-mail')).toBeOnTheScreen();
    expect(screen.getByLabelText('Senha')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeOnTheScreen();
  });

  it('valida campos vazios antes de chamar a API', async () => {
    await renderComProviders(<LoginScreen />);

    await fireEvent.press(screen.getByTestId('login-submit'));

    await waitFor(() => expect(screen.getByText('Informe seu e-mail.')).toBeOnTheScreen());
    expect(screen.getByText('Informe sua senha.')).toBeOnTheScreen();
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('faz login com sucesso e persiste a sessão', async () => {
    authService.login.mockResolvedValue({ token: 'jwt', usuario: usuarioAluno });

    await renderComProviders(<LoginScreen />);
    await preencherLogin();
    await fireEvent.press(screen.getByTestId('login-submit'));

    await waitFor(() =>
      expect(authService.login).toHaveBeenCalledWith({
        email: 'maria@escola.com',
        senha: 'senhaSegura123',
      })
    );
  });

  it('exibe mensagem de credenciais inválidas em 401', async () => {
    authService.login.mockRejectedValue(
      new ApiError({ kind: 'http', status: 401, message: 'E-mail ou senha inválidos.' })
    );

    await renderComProviders(<LoginScreen />);
    await preencherLogin('maria@escola.com', 'senhaErrada1');
    await fireEvent.press(screen.getByTestId('login-submit'));

    await waitFor(() =>
      expect(screen.getByTestId('login-erro')).toHaveTextContent('E-mail ou senha inválidos.')
    );
  });

  it('exibe mensagem de conta desativada em 403', async () => {
    authService.login.mockRejectedValue(
      new ApiError({ kind: 'http', status: 403, message: 'Usuário desativado.' })
    );

    await renderComProviders(<LoginScreen />);
    await preencherLogin();
    await fireEvent.press(screen.getByTestId('login-submit'));

    await waitFor(() =>
      expect(screen.getByTestId('login-erro')).toHaveTextContent(/desativada/i)
    );
  });

  it('exibe mensagem de limite de tentativas em 429', async () => {
    authService.login.mockRejectedValue(
      new ApiError({
        kind: 'http',
        status: 429,
        message: 'Muitas tentativas de login. Tente novamente em alguns minutos.',
      })
    );

    await renderComProviders(<LoginScreen />);
    await preencherLogin();
    await fireEvent.press(screen.getByTestId('login-submit'));

    await waitFor(() =>
      expect(screen.getByTestId('login-erro')).toHaveTextContent(/Muitas tentativas/i)
    );
    expect(screen.getByTestId('login-erro')).toHaveTextContent(/aguarde/i);
  });

  it('associa erros de validação do backend (422) aos campos', async () => {
    authService.login.mockRejectedValue(
      new ApiError({
        kind: 'http',
        status: 422,
        message: 'Dados inválidos na requisição.',
        detalhes: [{ campo: 'email', mensagem: 'E-mail inválido.' }],
      })
    );

    await renderComProviders(<LoginScreen />);
    await preencherLogin();
    await fireEvent.press(screen.getByTestId('login-submit'));

    await waitFor(() => expect(screen.getByText('E-mail inválido.')).toBeOnTheScreen());
  });

  it('exibe erro de rede', async () => {
    authService.login.mockRejectedValue(
      new ApiError({ kind: 'network', message: 'Sem conexão.' })
    );

    await renderComProviders(<LoginScreen />);
    await preencherLogin();
    await fireEvent.press(screen.getByTestId('login-submit'));

    await waitFor(() =>
      expect(screen.getByTestId('login-erro')).toHaveTextContent(/conectar ao servidor/i)
    );
  });

  it('mostra estado de carregamento durante o envio', async () => {
    let resolver: ((valor: unknown) => void) | undefined;
    authService.login.mockReturnValue(
      new Promise((resolve) => {
        resolver = resolve;
      })
    );

    await renderComProviders(<LoginScreen />);
    await preencherLogin();

    // Não aguardamos o press: a requisição fica pendente de propósito para
    // observar o estado de carregamento.
    const envio = fireEvent.press(screen.getByTestId('login-submit'));

    await waitFor(() => expect(screen.getByRole('button', { name: 'Entrar' })).toBeDisabled());

    resolver?.({ token: 'jwt', usuario: usuarioAluno });
    await envio;
  });
});
