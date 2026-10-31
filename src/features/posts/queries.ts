import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ApiError } from '@/core/http/ApiError';

import { useAuth } from '../auth/AuthContext';
import {
  atualizarPost,
  buscarPosts,
  criarPost,
  excluirPost,
  listarPosts,
  obterPost,
} from './postsService';
import type { DadosPost } from './types';

/**
 * Chaves de cache do domínio de postagens.
 *
 * Todas começam com `posts`, o que permite invalidar o domínio inteiro com
 * `queryClient.invalidateQueries({ queryKey: postsKeys.all })` após qualquer
 * operação de CRUD.
 */
export const postsKeys = {
  all: ['posts'] as const,
  lista: () => [...postsKeys.all, 'lista'] as const,
  busca: (termo: string) => [...postsKeys.all, 'busca', termo] as const,
  detalhe: (id: string) => [...postsKeys.all, 'detalhe', id] as const,
};

/**
 * Lista completa de postagens (`GET /posts`).
 *
 * `enabled` permite desligar a listagem enquanto uma busca está ativa, evitando
 * duas requisições concorrentes para a mesma tela.
 */
export const useListarPosts = (enabled = true) =>
  useQuery({
    queryKey: postsKeys.lista(),
    queryFn: ({ signal }) => listarPosts(signal),
    enabled,
  });

/**
 * Busca de postagens (`GET /posts/search?termo=`).
 *
 * A query só é executada quando há termo não vazio — o backend responde `400`
 * para termo ausente. O termo já chega "debounced" da tela, evitando uma
 * requisição por tecla digitada.
 */
export const useBuscarPosts = (termo: string) => {
  const termoNormalizado = termo.trim();

  return useQuery({
    queryKey: postsKeys.busca(termoNormalizado),
    queryFn: ({ signal }) => buscarPosts(termoNormalizado, signal),
    enabled: termoNormalizado.length > 0,
  });
};

/** Detalhe de uma postagem (`GET /posts/:id`). */
export const usePost = (id: string | undefined) =>
  useQuery({
    queryKey: postsKeys.detalhe(id ?? ''),
    queryFn: ({ signal }) => obterPost(id as string, signal),
    enabled: Boolean(id),
  });

/**
 * Token para operações de escrita.
 *
 * As telas que usam estas mutações são protegidas por `RoleGuard`, então o
 * token existe na prática. Ainda assim, a ausência é tratada como erro de
 * sessão em vez de disparar uma requisição anônima que o backend rejeitaria.
 */
const exigirToken = (token: string | null): string => {
  if (!token) {
    throw new ApiError({
      kind: 'unknown',
      message: 'Sua sessão expirou. Entre novamente para continuar.',
    });
  }

  return token;
};

/**
 * Criação de postagem (`POST /posts`).
 *
 * Após o sucesso, invalida todas as listagens/buscas para que a nova postagem
 * apareça sem refetch manual.
 */
export const useCriarPost = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dados: DadosPost) => criarPost(dados, exigirToken(token)),
    onSuccess: (post) => {
      // Já deixa o detalhe em cache e invalida listas/buscas.
      queryClient.setQueryData(postsKeys.detalhe(post._id), post);
      void queryClient.invalidateQueries({ queryKey: postsKeys.all });
    },
  });
};

/**
 * Edição de postagem (`PUT /posts/:id`).
 *
 * Atualiza o cache do detalhe imediatamente (evita "piscar" dados antigos) e
 * invalida as listagens/buscas.
 */
export const useAtualizarPost = (id: string) => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dados: DadosPost) => atualizarPost(id, dados, exigirToken(token)),
    onSuccess: (post) => {
      queryClient.setQueryData(postsKeys.detalhe(id), post);
      void queryClient.invalidateQueries({ queryKey: postsKeys.all });
    },
  });
};

/**
 * Exclusão de postagem (`DELETE /posts/:id`).
 *
 * Remove o detalhe do cache e invalida as listagens/buscas.
 */
export const useExcluirPost = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => excluirPost(id, exigirToken(token)),
    onSuccess: (_resposta, id) => {
      queryClient.removeQueries({ queryKey: postsKeys.detalhe(id) });
      void queryClient.invalidateQueries({ queryKey: postsKeys.all });
    },
  });
};
