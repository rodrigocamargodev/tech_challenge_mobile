import { ApiError } from '@/core/http/ApiError';

/**
 * Token para operações autenticadas.
 *
 * As telas que usam mutações protegidas são envolvidas por `RoleGuard`, então o
 * token existe na prática. Ainda assim, a ausência é tratada como erro de
 * sessão em vez de disparar uma requisição anônima que o backend rejeitaria
 * com `401`.
 */
export const exigirToken = (token: string | null): string => {
  if (!token) {
    throw new ApiError({
      kind: 'unknown',
      message: 'Sua sessão expirou. Entre novamente para continuar.',
    });
  }

  return token;
};
