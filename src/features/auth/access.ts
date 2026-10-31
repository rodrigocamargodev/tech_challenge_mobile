import type { AuthStatus } from './AuthContext';
import type { Usuario } from './types';

/**
 * Regras de acesso por papel.
 *
 * Estas funções são a fonte única de verdade para decidir o que cada usuário
 * pode acessar no app. Elas **não substituem** a autorização do backend: são
 * apenas a camada de navegação. Toda operação sensível continua validada no
 * servidor, que responde `403` quando o papel é insuficiente.
 */

/** Áreas de acesso do aplicativo. */
export type AreaAcesso =
  /** Rotas públicas (login, cadastro). */
  | 'publica'
  /** Rotas que exigem sessão válida (qualquer papel). */
  | 'autenticada'
  /** Rotas exclusivas de professor. */
  | 'professor';

/**
 * Indica se o usuário pode acessar uma área.
 *
 * @param usuario usuário autenticado ou `null`.
 * @param area área desejada.
 */
export const podeAcessar = (usuario: Usuario | null, area: AreaAcesso): boolean => {
  switch (area) {
    case 'publica':
      return true;
    case 'autenticada':
      return usuario !== null;
    case 'professor':
      return usuario?.role === 'professor';
    default:
      return false;
  }
};

/**
 * Rota inicial coerente com o estado da sessão.
 *
 * Usada apenas como referência de navegação; a proteção efetiva é feita pelos
 * grupos protegidos do Expo Router.
 */
export const rotaInicial = (status: AuthStatus): '/' | '/login' =>
  status === 'authenticated' ? '/' : '/login';
