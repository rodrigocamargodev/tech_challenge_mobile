import { screen, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';

import { ApiError } from '@/core/http/ApiError';
import { clearToken, saveToken } from '@/core/storage/secureTokenStorage';
import { renderComProviders } from '@/test/renderComProviders';

import { RoleGuard } from './RoleGuard';

jest.mock('@/features/auth/authService', () => ({
  login: jest.fn(),
  cadastrarAluno: jest.fn(),
  buscarUsuarioAutenticado: jest.fn(),
}));

const mockRedirect = jest.fn();

jest.mock('expo-router', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { Text: RNText } = jest.requireActual<typeof import('react-native')>('react-native');

  return {
    Redirect: ({ href }: { href: string }) => {
      mockRedirect(href);
      return React.createElement(RNText, null, `redirect:${href}`);
    },
  };
});

// eslint-disable-next-line @typescript-eslint/no-require-imports
const authService = require('@/features/auth/authService') as {
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

const usuarioProfessor = { ...usuarioAluno, _id: 'u2', role: 'professor' as const };

const conteudoPrivado = <Text>Conteúdo privado</Text>;

beforeEach(async () => {
  jest.clearAllMocks();
  mockRedirect.mockClear();
  await clearToken();
});

describe('RoleGuard', () => {
  it('não exibe conteúdo privado enquanto a sessão é restaurada', async () => {
    await saveToken('token');
    authService.buscarUsuarioAutenticado.mockReturnValue(new Promise(() => {}));

    await renderComProviders(
      <RoleGuard area="autenticada">{conteudoPrivado}</RoleGuard>
    );

    expect(screen.getByTestId('guarda-carregando')).toBeOnTheScreen();
    expect(screen.queryByText('Conteúdo privado')).toBeNull();
  });

  it('redireciona para o login quando não há sessão', async () => {
    await renderComProviders(
      <RoleGuard area="autenticada">{conteudoPrivado}</RoleGuard>
    );

    await waitFor(() => expect(mockRedirect).toHaveBeenCalledWith('/login'));
    expect(screen.queryByText('Conteúdo privado')).toBeNull();
  });

  it('libera área autenticada para aluno', async () => {
    await saveToken('token');
    authService.buscarUsuarioAutenticado.mockResolvedValue({ usuario: usuarioAluno });

    await renderComProviders(
      <RoleGuard area="autenticada">{conteudoPrivado}</RoleGuard>
    );

    await waitFor(() => expect(screen.getByText('Conteúdo privado')).toBeOnTheScreen());
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it('bloqueia área de professor para aluno e redireciona para a home', async () => {
    await saveToken('token');
    authService.buscarUsuarioAutenticado.mockResolvedValue({ usuario: usuarioAluno });

    await renderComProviders(<RoleGuard area="professor">{conteudoPrivado}</RoleGuard>);

    await waitFor(() => expect(mockRedirect).toHaveBeenCalledWith('/'));
    expect(screen.queryByText('Conteúdo privado')).toBeNull();
  });

  it('libera área de professor para professor', async () => {
    await saveToken('token');
    authService.buscarUsuarioAutenticado.mockResolvedValue({ usuario: usuarioProfessor });

    await renderComProviders(<RoleGuard area="professor">{conteudoPrivado}</RoleGuard>);

    await waitFor(() => expect(screen.getByText('Conteúdo privado')).toBeOnTheScreen());
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it('redireciona para o login quando a sessão expira durante a restauração', async () => {
    await saveToken('token-expirado');
    authService.buscarUsuarioAutenticado.mockRejectedValue(
      new ApiError({ kind: 'http', status: 401, message: 'Token inválido ou expirado.' })
    );

    await renderComProviders(
      <RoleGuard area="autenticada">{conteudoPrivado}</RoleGuard>
    );

    await waitFor(() => expect(mockRedirect).toHaveBeenCalledWith('/login'));
    expect(screen.queryByText('Conteúdo privado')).toBeNull();
  });
});
