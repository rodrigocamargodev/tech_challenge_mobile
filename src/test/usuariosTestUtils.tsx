import { QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react-native';
import type { ReactElement, ReactNode } from 'react';

import { AuthProvider } from '@/features/auth/AuthContext';
import type { Usuario } from '@/features/auth/types';

import { criarQueryClientDeTeste } from './queryClientDeTeste';

/**
 * Utilitários dos testes de gerenciamento de usuários.
 *
 * Assim como nos testes de postagens, o `AuthProvider` real é mantido para que
 * a restauração de sessão (e, portanto, o papel do usuário) seja exercitada de
 * verdade — é dela que depende a autorização das telas.
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

export const outroAluno: Usuario = {
  ...usuarioAluno,
  _id: 'u3',
  nome: 'Pedro Aluno',
  email: 'pedro@escola.com',
};

export const alunoInativo: Usuario = {
  ...outroAluno,
  _id: 'u4',
  nome: 'Ana Inativa',
  email: 'ana@escola.com',
  ativo: false,
};

export const renderComProvidersUsuarios = async (ui: ReactElement) => {
  const queryClient = criarQueryClientDeTeste();

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );

  const resultado = await render(ui, { wrapper: Wrapper });
  return { ...resultado, queryClient };
};
