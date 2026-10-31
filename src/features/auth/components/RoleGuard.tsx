import { Redirect } from 'expo-router';
import type { ReactNode } from 'react';

import { LoadingState } from '@/shared/components/LoadingState';

import { useAuth } from '../AuthContext';
import { podeAcessar, type AreaAcesso } from '../access';

export interface RoleGuardProps {
  /** Área exigida pela tela protegida. */
  area: AreaAcesso;
  children: ReactNode;
  /** Destino quando o acesso é negado. Padrão: home. */
  redirectTo?: '/' | '/login';
}

/**
 * Proteção de rota por papel.
 *
 * - Enquanto a sessão é restaurada, exibe apenas o estado de carregamento —
 *   nenhum conteúdo privado é renderizado.
 * - Sem sessão válida, redireciona para o login.
 * - Com papel insuficiente, redireciona para a home.
 *
 * Importante: esta é uma barreira de navegação, não de segurança. O backend
 * continua sendo a autoridade final e responde `403` quando necessário.
 */
export function RoleGuard({ area, children, redirectTo }: RoleGuardProps) {
  const { status, usuario } = useAuth();

  if (status === 'restoring') {
    return <LoadingState message="Verificando sua sessão…" testID="guarda-carregando" />;
  }

  if (!podeAcessar(usuario, area)) {
    const destino = redirectTo ?? (status === 'authenticated' ? '/' : '/login');
    return <Redirect href={destino} />;
  }

  return <>{children}</>;
}
