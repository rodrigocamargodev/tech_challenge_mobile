import { QueryClient } from '@tanstack/react-query';

import { ApiError } from './ApiError';

/**
 * Configuração única do TanStack Query.
 *
 * - `retry`: não repete erros de negócio (4xx); repete apenas falhas de rede
 *   e erros de servidor, no máximo duas vezes.
 * - `staleTime`: dados são considerados frescos por 30s, evitando refetch
 *   desnecessário ao navegar entre telas.
 */
export const createQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: (failureCount, erro) => {
          if (erro instanceof ApiError) {
            if (erro.isNetworkError) return failureCount < 2;
            if (erro.status !== undefined && erro.status >= 500) return failureCount < 2;
            return false;
          }
          return failureCount < 1;
        },
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
