import { QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react-native';
import type { ReactElement, ReactNode } from 'react';

import { AuthProvider } from '@/features/auth/AuthContext';

import { criarQueryClientDeTeste } from './queryClientDeTeste';

/**
 * Renderiza um componente dentro dos providers reais usados pelo app.
 *
 * Não substitui o `AuthProvider` por um mock: os testes de sessão precisam do
 * comportamento verdadeiro de restauração, login e logout.
 *
 * O `QueryClient` de teste não agenda temporizadores de coleta (ver
 * `queryClientDeTeste.ts`), o que evita handles abertos ao fim da suíte.
 */
export const renderComProviders = async (ui: ReactElement) => {
  const queryClient = criarQueryClientDeTeste();

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );

  const resultado = await render(ui, { wrapper: Wrapper });
  return { ...resultado, queryClient };
};
