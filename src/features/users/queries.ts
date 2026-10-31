import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/AuthContext';
import { exigirToken } from '@/features/auth/sessionToken';

import {
  atualizarUsuario,
  criarUsuario,
  desativarUsuario,
  listarUsuarios,
  obterUsuario,
} from './usersService';
import type { DadosCriacaoUsuario, DadosEdicaoUsuario, Papel } from './types';

/**
 * Chaves de cache do domínio de usuários.
 *
 * Todas começam com `users`, permitindo invalidar o domínio inteiro com
 * `queryClient.invalidateQueries({ queryKey: usersKeys.all })` após qualquer
 * criação/edição/desativação.
 */
export const usersKeys = {
  all: ['users'] as const,
  lista: (papel?: Papel) => [...usersKeys.all, 'lista', papel ?? 'todos'] as const,
  detalhe: (id: string) => [...usersKeys.all, 'detalhe', id] as const,
};

/**
 * Listagem de usuários (`GET /users?role=`).
 *
 * O filtro por papel é aplicado **pelo backend**, não no cliente: assim os
 * dados já chegam filtrados e o cache é separado por papel.
 *
 * `enabled` evita a requisição para alunos — a tela já está protegida por
 * `RoleGuard`, mas a query também não deve disparar sem token.
 */
export const useListarUsuarios = (papel?: Papel) => {
  const { token, isProfessor } = useAuth();

  return useQuery({
    queryKey: usersKeys.lista(papel),
    queryFn: ({ signal }) =>
      listarUsuarios({ token: exigirToken(token), papel, signal }),
    enabled: isProfessor && Boolean(token),
  });
};

/** Detalhe de um usuário (`GET /users/:id`). */
export const useUsuario = (id: string | undefined) => {
  const { token, isProfessor } = useAuth();

  return useQuery({
    queryKey: usersKeys.detalhe(id ?? ''),
    queryFn: ({ signal }) => obterUsuario(id as string, exigirToken(token), signal),
    enabled: isProfessor && Boolean(token) && Boolean(id),
  });
};

/** Criação de usuário (`POST /users`). */
export const useCriarUsuario = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dados: DadosCriacaoUsuario) => criarUsuario(dados, exigirToken(token)),
    onSuccess: (usuario) => {
      queryClient.setQueryData(usersKeys.detalhe(usuario._id), usuario);
      void queryClient.invalidateQueries({ queryKey: usersKeys.all });
    },
  });
};

/** Atualização de usuário (`PUT /users/:id`). */
export const useAtualizarUsuario = (id: string) => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dados: DadosEdicaoUsuario) =>
      atualizarUsuario(id, dados, exigirToken(token)),
    onSuccess: (usuario) => {
      queryClient.setQueryData(usersKeys.detalhe(id), usuario);
      void queryClient.invalidateQueries({ queryKey: usersKeys.all });
    },
  });
};

/**
 * Desativação lógica (`DELETE /users/:id`).
 *
 * A resposta já traz o usuário com `ativo: false`, então o detalhe é atualizado
 * de imediato; as listagens são invalidadas para refletir o novo estado.
 */
export const useDesativarUsuario = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => desativarUsuario(id, exigirToken(token)),
    onSuccess: (resposta, id) => {
      queryClient.setQueryData(usersKeys.detalhe(id), resposta.usuario);
      void queryClient.invalidateQueries({ queryKey: usersKeys.all });
    },
  });
};

/**
 * Reativação (`PUT /users/:id` com `{ ativo: true }`).
 *
 * Não existe rota dedicada no backend; a reativação é uma atualização parcial.
 * Fica separada da edição para deixar a intenção explícita nas telas.
 */
export const useReativarUsuario = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      atualizarUsuario(id, { ativo: true }, exigirToken(token)),
    onSuccess: (usuario) => {
      queryClient.setQueryData(usersKeys.detalhe(usuario._id), usuario);
      void queryClient.invalidateQueries({ queryKey: usersKeys.all });
    },
  });
};
