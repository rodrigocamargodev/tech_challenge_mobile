import { QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react-native';
import type { ReactElement, ReactNode } from 'react';

import { AuthProvider } from '@/features/auth/AuthContext';
import type { Usuario } from '@/features/auth/types';

import { criarQueryClientDeTeste } from './queryClientDeTeste';

/**
 * Utilitários dos testes de postagens.
 *
 * Mantém o `AuthProvider` real (para exercitar a restauração de sessão) e
 * devolve o `QueryClient` para inspecionar cache e invalidações.
 */

export const usuarioAluno: Usuario = {
  _id: 'u1',
  nome: 'Maria Silva',
  email: 'maria@escola.com',
  role: 'aluno',
  ativo: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

export const usuarioProfessor: Usuario = {
  ...usuarioAluno,
  _id: 'u2',
  nome: 'João Professor',
  email: 'joao@escola.com',
  role: 'professor',
};

export const postExemplo = {
  _id: 'p1',
  titulo: 'Introdução ao Node.js',
  conteudo: 'Nesta aula veremos os fundamentos do Node.js e como criar servidores.',
  autor: 'João Professor',
  criadoEm: '2026-01-10T12:00:00.000Z',
  atualizadoEm: '2026-01-10T12:00:00.000Z',
};

export const outroPost = {
  _id: 'p2',
  titulo: 'Lousa Moderna',
  conteudo: 'Um resumo sobre o design system usado no aplicativo.',
  autor: 'João Professor',
  criadoEm: '2026-01-12T12:00:00.000Z',
  atualizadoEm: '2026-01-12T12:00:00.000Z',
};

/**
 * Renderiza com os providers reais e devolve o `QueryClient`.
 *
 * Usa o cliente de teste (sem temporizadores de coleta e sem retry), o que
 * mantém a suíte rápida e sem handles abertos.
 */
export const renderComProvidersPosts = async (ui: ReactElement) => {
  const queryClient = criarQueryClientDeTeste();

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );

  const resultado = await render(ui, { wrapper: Wrapper });
  return { ...resultado, queryClient };
};
