import { useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { ApiError } from '@/core/http/ApiError';
import { subscribeToUnauthorized } from '@/core/http/authEvents';
import { clearToken, getToken, saveToken } from '@/core/storage/secureTokenStorage';

import { buscarUsuarioAutenticado, cadastrarAluno, login as loginRequest } from './authService';
import type { CredenciaisLogin, DadosCadastroAluno, Sessao, Usuario } from './types';

/**
 * Estado da sessão.
 *
 * - `restoring`: ainda verificando o token salvo. Nenhum conteúdo privado deve
 *   ser exibido neste estado.
 * - `authenticated`: sessão válida confirmada pelo backend.
 * - `unauthenticated`: sem sessão (ou sessão encerrada).
 */
export type AuthStatus = 'restoring' | 'authenticated' | 'unauthenticated';

/** Resultado do cadastro: indica se a sessão já foi aberta automaticamente. */
export interface ResultadoCadastro {
  usuario: Usuario;
  sessaoIniciada: boolean;
}

export interface AuthContextValue {
  status: AuthStatus;
  usuario: Usuario | null;
  token: string | null;
  /** `true` apenas quando há sessão válida de professor. */
  isProfessor: boolean;
  /** Mensagem exibida quando a restauração falhou por motivo não autenticável. */
  restoreError: string | null;
  login: (credenciais: CredenciaisLogin) => Promise<void>;
  cadastrar: (dados: DadosCadastroAluno) => Promise<ResultadoCadastro>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Provider de autenticação.
 *
 * Responsabilidades:
 * - restaurar a sessão a partir do SecureStore + `GET /auth/me`;
 * - manter token e usuário em memória;
 * - encerrar a sessão de forma centralizada ao receber `401`;
 * - limpar o cache privado no logout.
 *
 * A autorização definitiva continua sendo do backend: o app apenas reflete o
 * papel recebido.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<AuthStatus>('restoring');
  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  // Evita atualizar estado após desmontagem (ex.: teste encerrado no meio).
  const montado = useRef(true);
  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
    };
  }, []);

  /**
   * Encerra a sessão: remove o token seguro, limpa o cache privado e volta ao
   * estado não autenticado. É idempotente e usado tanto pelo logout explícito
   * quanto pelo tratamento centralizado de `401`.
   */
  const encerrarSessao = useCallback(async () => {
    await clearToken();
    // Remove dados privados em cache (posts, usuários, etc.).
    queryClient.clear();

    if (montado.current) {
      setSessao(null);
      setStatus('unauthenticated');
    }
  }, [queryClient]);

  // Restauração da sessão: executada uma única vez na montagem do provider.
  useEffect(() => {
    let cancelado = false;

    const restaurar = async () => {
      const tokenSalvo = await getToken();

      if (cancelado) return;

      if (!tokenSalvo) {
        setStatus('unauthenticated');
        return;
      }

      try {
        const { usuario } = await buscarUsuarioAutenticado(tokenSalvo);
        if (cancelado) return;

        setSessao({ token: tokenSalvo, usuario });
        setStatus('authenticated');
      } catch (erro) {
        if (cancelado) return;

        // 401 já dispara o evento centralizado; 403 indica usuário desativado.
        // Em ambos os casos a sessão não é válida e o token deve ser descartado.
        if (erro instanceof ApiError && (erro.isUnauthorized || erro.isForbidden)) {
          await clearToken();
          if (cancelado) return;
          setRestoreError(
            erro.isForbidden ? 'Sua conta está desativada. Procure um professor responsável.' : null
          );
          setStatus('unauthenticated');
          return;
        }

        // Falha de rede/servidor: não é possível confirmar a sessão. O token é
        // preservado, mas nenhum conteúdo privado é exibido.
        setRestoreError(
          erro instanceof ApiError
            ? erro.message
            : 'Não foi possível validar sua sessão. Entre novamente.'
        );
        setStatus('unauthenticated');
      }
    };

    void restaurar();

    return () => {
      cancelado = true;
    };
  }, []);

  // Tratamento centralizado de 401: qualquer requisição autenticada que receba
  // 401 encerra a sessão, sem que as telas precisem tratar isso.
  useEffect(() => {
    const cancelarInscricao = subscribeToUnauthorized(() => {
      void encerrarSessao();
    });

    return cancelarInscricao;
  }, [encerrarSessao]);

  const login = useCallback(async (credenciais: CredenciaisLogin) => {
    const { token, usuario } = await loginRequest(credenciais);

    await saveToken(token);

    if (!montado.current) return;

    setRestoreError(null);
    setSessao({ token, usuario });
    setStatus('authenticated');
  }, []);

  const cadastrar = useCallback(
    async (dados: DadosCadastroAluno): Promise<ResultadoCadastro> => {
      const { usuario } = await cadastrarAluno(dados);

      // O cadastro público não devolve token. Abrimos a sessão em seguida com
      // as mesmas credenciais; se isso falhar, a conta continua criada e o
      // usuário é encaminhado ao login.
      try {
        await login({ email: dados.email, senha: dados.senha });
        return { usuario, sessaoIniciada: true };
      } catch {
        return { usuario, sessaoIniciada: false };
      }
    },
    [login]
  );

  const logout = useCallback(async () => {
    setRestoreError(null);
    await encerrarSessao();
  }, [encerrarSessao]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      usuario: sessao?.usuario ?? null,
      token: sessao?.token ?? null,
      isProfessor: sessao?.usuario.role === 'professor',
      restoreError,
      login,
      cadastrar,
      logout,
    }),
    [status, sessao, restoreError, login, cadastrar, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Acesso ao contexto de autenticação. Deve ser usado dentro de `AuthProvider`. */
export function useAuth(): AuthContextValue {
  const contexto = useContext(AuthContext);

  if (!contexto) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider.');
  }

  return contexto;
}
