import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { clearToken, getToken, saveToken } from '@/core/storage/secureTokenStorage';
import { renderComProviders } from '@/test/renderComProviders';

import HomeScreen from '../../../app/(app)/index';

jest.mock('@/features/auth/authService', () => ({
  login: jest.fn(),
  cadastrarAluno: jest.fn(),
  buscarUsuarioAutenticado: jest.fn(),
}));

jest.mock('@/features/posts/postsService', () => ({
  listarPosts: jest.fn(),
  buscarPosts: jest.fn(),
  obterPost: jest.fn(),
  criarPost: jest.fn(),
  atualizarPost: jest.fn(),
  excluirPost: jest.fn(),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
    canGoBack: () => true,
  }),
  useLocalSearchParams: () => ({}),
  Redirect: () => null,
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const authService = require('@/features/auth/authService') as {
  buscarUsuarioAutenticado: jest.Mock;
};
// eslint-disable-next-line @typescript-eslint/no-require-imports
const postsService = require('@/features/posts/postsService') as {
  listarPosts: jest.Mock;
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

beforeEach(async () => {
  jest.clearAllMocks();
  await clearToken();
});

describe('home autenticada', () => {
  it('cumprimenta o usuário e exibe a listagem de postagens', async () => {
    await saveToken('token');
    authService.buscarUsuarioAutenticado.mockResolvedValue({ usuario: usuarioAluno });
    postsService.listarPosts.mockResolvedValue([]);

    await renderComProviders(<HomeScreen />);

    await waitFor(() => expect(screen.getByText('Olá, Maria Silva!')).toBeOnTheScreen());
    await waitFor(() => expect(screen.getByTestId('posts-vazio')).toBeOnTheScreen());
  });

  it('encerra a sessão ao tocar em Sair', async () => {
    await saveToken('token');
    authService.buscarUsuarioAutenticado.mockResolvedValue({ usuario: usuarioAluno });
    postsService.listarPosts.mockResolvedValue([]);

    await renderComProviders(<HomeScreen />);
    await waitFor(() => expect(screen.getByText('Olá, Maria Silva!')).toBeOnTheScreen());

    await fireEvent.press(screen.getByTestId('home-logout'));

    await waitFor(() => expect(screen.getByText('Olá, visitante!')).toBeOnTheScreen());
    await expect(getToken()).resolves.toBeNull();
  });
});
