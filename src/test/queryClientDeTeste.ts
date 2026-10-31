import type { QueryClient } from '@tanstack/react-query';

import { createQueryClient } from '@/core/http/queryClient';

/**
 * `QueryClient` para testes.
 *
 * Diferenças em relação ao cliente de produção, e o motivo:
 * - `gcTime: Infinity` em queries **e** mutations — o TanStack Query agenda um
 *   temporizador por entrada de cache (inclusive no `MutationCache`). Em testes
 *   isso mantém o processo do Jest vivo depois do fim do caso (aviso "worker
 *   process has failed to exit gracefully") e deixa a suíte mais lenta. Sem
 *   coleta, não há temporizador.
 * - `retry: false` — os testes observam o estado de erro imediatamente, sem
 *   esperar as tentativas automáticas.
 *
 * O restante da configuração (staleTime, refetchOnWindowFocus) continua igual
 * ao de produção, para que os testes exercitem o comportamento real.
 */
export const criarQueryClientDeTeste = (): QueryClient => {
  const queryClient = createQueryClient();

  queryClient.setDefaultOptions({
    queries: {
      ...queryClient.getDefaultOptions().queries,
      gcTime: Infinity,
      retry: false,
    },
    mutations: {
      ...queryClient.getDefaultOptions().mutations,
      gcTime: Infinity,
      retry: false,
    },
  });

  return queryClient;
};
