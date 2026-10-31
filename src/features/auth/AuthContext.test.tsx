import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { QueryClientProvider } from '@tanstack/react-query';

import { ApiError } from '@/core/http/ApiError';
import { emitUnauthorized, resetUnauthorizedListeners } from '@/core/http/authEvents';
import { createQueryClient } from '@/core/http/queryClient';
import { clearToken, getToken, saveToken } from '@/core/storage/secureTokenStorage';

import { AuthProvider, useAuth } from './AuthContext';
import type { Usuario } from './types';

jest.mock('@/features/auth/authService', () => ({
  login: jest.fn(),
  cadastrarAluno: jest.fn(),
  buscarUsuarioAutenticado: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const authService = require('@/features/auth/authService') as {
  login: jest.Mock;
  cadastrarAluno: jest.Mock;
  buscarUsuarioAutenticado: jest.Mock;
};

const usuarioAluno: Usuario = {
  _id: 'u1',
  nome: 'Maria Silva',
  email: 'maria@escola.com',
  role: 'aluno',
  ativo: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const usuarioProfessor: Usuario = {
  ...usuarioAluno,
  _id: 'u2',
  nome: 'João Professor',
  email: 'joao@escola.com',
  role: 'professor',
};

/**
 * Renderiza o hook `useAuth` com os providers reais do app.
 * Devolve também o `QueryClient` para inspecionar o cache.
 */
const renderAuth = async () => {
  const queryClient = createQueryClient();

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );

  const resultado = await renderHook(() => useAuth(), { wrapper });
  return { ...resultado, queryClient };
};

beforeEach(async () => {
  jest.clearAllMocks();
  resetUnauthorizedListeners();
  await clearToken();
});

describe('AuthProvider — restauração de sessão', () => {
  it('começa no estado restoring e não expõe usuário', async () => {
    await saveToken('token-pendente');
    authService.buscarUsuarioAutenticado.mockReturnValue(new Promise(() => {}));

    const { result } = await renderAuth();

    expect(result.current.status).toBe('restoring');
    expect(result.current.usuario).toBeNull();
  });

  it('restaura sessão válida a partir do token salvo', async () => {
    await saveToken('token-valido');
    authService.buscarUsuarioAutenticado.mockResolvedValue({ usuario: usuarioAluno });

    const { result } = await renderAuth();

    await waitFor(() => expect(result.current.status).toBe('authenticated'));
    expect(result.current.usuario?.nome).toBe('Maria Silva');
    expect(authService.buscarUsuarioAutenticado).toHaveBeenCalledWith('token-valido');
  });

  it('vai para unauthenticated quando não há token salvo', async () => {
    const { result } = await renderAuth();

    await waitFor(() => expect(result.current.status).toBe('unauthenticated'));
    expect(authService.buscarUsuarioAutenticado).not.toHaveBeenCalled();
  });

  it('descarta o token e encerra a sessão quando /auth/me responde 401', async () => {
    await saveToken('token-expirado');
    authService.buscarUsuarioAutenticado.mockRejectedValue(
      new ApiError({ kind: 'http', status: 401, message: 'Token inválido ou expirado.' })
    );

    const { result } = await renderAuth();

    await waitFor(() => expect(result.current.status).toBe('unauthenticated'));
    await expect(getToken()).resolves.toBeNull();
  });

  it('informa conta desativada quando /auth/me responde 403', async () => {
    await saveToken('token-desativado');
    authService.buscarUsuarioAutenticado.mockRejectedValue(
      new ApiError({ kind: 'http', status: 403, message: 'Usuário desativado.' })
    );

    const { result } = await renderAuth();

    await waitFor(() => expect(result.current.status).toBe('unauthenticated'));
    expect(result.current.restoreError).toMatch(/desativada/i);
    await expect(getToken()).resolves.toBeNull();
  });

  it('preserva o token mas não autentica quando a falha é de rede', async () => {
    await saveToken('token-valido');
    authService.buscarUsuarioAutenticado.mockRejectedValue(
      new ApiError({ kind: 'network', message: 'Sem conexão.' })
    );

    const { result } = await renderAuth();

    await waitFor(() => expect(result.current.status).toBe('unauthenticated'));
    expect(result.current.restoreError).toMatch(/Sem conexão/i);
    await expect(getToken()).resolves.toBe('token-valido');
  });
});

describe('AuthProvider — login', () => {
  it('autentica e persiste o token no armazenamento seguro', async () => {
    authService.login.mockResolvedValue({ token: 'novo-token', usuario: usuarioAluno });

    const { result } = await renderAuth();
    await waitFor(() => expect(result.current.status).toBe('unauthenticated'));

    await act(async () => {
      await result.current.login({ email: 'maria@escola.com', senha: 'senhaSegura123' });
    });

    expect(result.current.status).toBe('authenticated');
    expect(result.current.usuario?.nome).toBe('Maria Silva');
    await expect(getToken()).resolves.toBe('novo-token');
  });

  it('propaga o erro de credenciais inválidas sem autenticar', async () => {
    authService.login.mockRejectedValue(
      new ApiError({ kind: 'http', status: 401, message: 'E-mail ou senha inválidos.' })
    );

    const { result } = await renderAuth();
    await waitFor(() => expect(result.current.status).toBe('unauthenticated'));

    await act(async () => {
      await expect(
        result.current.login({ email: 'maria@escola.com', senha: 'errada' })
      ).rejects.toMatchObject({ status: 401 });
    });

    expect(result.current.status).toBe('unauthenticated');
    await expect(getToken()).resolves.toBeNull();
  });

  it('expõe isProfessor apenas para professor', async () => {
    authService.login.mockResolvedValue({ token: 't', usuario: usuarioProfessor });

    const { result } = await renderAuth();
    await waitFor(() => expect(result.current.status).toBe('unauthenticated'));

    await act(async () => {
      await result.current.login({ email: 'joao@escola.com', senha: 'senhaSegura123' });
    });

    expect(result.current.isProfessor).toBe(true);
  });

  it('expõe isProfessor falso para aluno', async () => {
    authService.login.mockResolvedValue({ token: 't', usuario: usuarioAluno });

    const { result } = await renderAuth();
    await waitFor(() => expect(result.current.status).toBe('unauthenticated'));

    await act(async () => {
      await result.current.login({ email: 'maria@escola.com', senha: 'senhaSegura123' });
    });

    expect(result.current.isProfessor).toBe(false);
  });
});

describe('AuthProvider — cadastro', () => {
  it('cria o aluno e abre a sessão automaticamente', async () => {
    authService.cadastrarAluno.mockResolvedValue({ usuario: usuarioAluno });
    authService.login.mockResolvedValue({ token: 'token-cadastro', usuario: usuarioAluno });

    const { result } = await renderAuth();
    await waitFor(() => expect(result.current.status).toBe('unauthenticated'));

    let sessaoIniciada: boolean | undefined;
    await act(async () => {
      const resultado = await result.current.cadastrar({
        nome: 'Maria Silva',
        email: 'maria@escola.com',
        senha: 'senhaSegura123',
      });
      sessaoIniciada = resultado.sessaoIniciada;
    });

    expect(sessaoIniciada).toBe(true);
    expect(result.current.status).toBe('authenticated');
    expect(authService.cadastrarAluno).toHaveBeenCalledWith({
      nome: 'Maria Silva',
      email: 'maria@escola.com',
      senha: 'senhaSegura123',
    });
  });

  it('mantém a conta criada quando o login automático falha', async () => {
    authService.cadastrarAluno.mockResolvedValue({ usuario: usuarioAluno });
    authService.login.mockRejectedValue(
      new ApiError({ kind: 'http', status: 429, message: 'Muitas tentativas.' })
    );

    const { result } = await renderAuth();
    await waitFor(() => expect(result.current.status).toBe('unauthenticated'));

    let sessaoIniciada: boolean | undefined;
    await act(async () => {
      const resultado = await result.current.cadastrar({
        nome: 'Maria Silva',
        email: 'maria@escola.com',
        senha: 'senhaSegura123',
      });
      sessaoIniciada = resultado.sessaoIniciada;
    });

    expect(sessaoIniciada).toBe(false);
    expect(result.current.status).toBe('unauthenticated');
  });
});

describe('AuthProvider — logout e 401 centralizado', () => {
  it('logout limpa token, sessão e cache privado', async () => {
    authService.login.mockResolvedValue({ token: 'token', usuario: usuarioAluno });

    const { result, queryClient } = await renderAuth();
    await waitFor(() => expect(result.current.status).toBe('unauthenticated'));

    await act(async () => {
      await result.current.login({ email: 'maria@escola.com', senha: 'senhaSegura123' });
    });

    queryClient.setQueryData(['posts'], [{ _id: 'p1' }]);
    expect(queryClient.getQueryData(['posts'])).toBeDefined();

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.status).toBe('unauthenticated');
    expect(result.current.usuario).toBeNull();
    await expect(getToken()).resolves.toBeNull();
    expect(queryClient.getQueryData(['posts'])).toBeUndefined();
  });

  it('encerra a sessão ao receber evento de 401', async () => {
    authService.login.mockResolvedValue({ token: 'token', usuario: usuarioAluno });

    const { result } = await renderAuth();
    await waitFor(() => expect(result.current.status).toBe('unauthenticated'));

    await act(async () => {
      await result.current.login({ email: 'maria@escola.com', senha: 'senhaSegura123' });
    });
    expect(result.current.status).toBe('authenticated');

    await act(async () => {
      emitUnauthorized();
    });

    await waitFor(() => expect(result.current.status).toBe('unauthenticated'));
    await expect(getToken()).resolves.toBeNull();
  });
});
