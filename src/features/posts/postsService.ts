import { request } from '@/core/http/client';

import type { DadosPost, Post, RespostaExclusaoPost } from './types';

/**
 * Serviço de postagens.
 *
 * Apenas transporte HTTP: não guarda estado, não acessa armazenamento e não
 * conhece telas. Cache, carregamento e invalidação são responsabilidade do
 * TanStack Query (ver `queries.ts`).
 *
 * Observações do contrato:
 * - `GET /posts` e `GET /posts/search` são públicos e **não** têm paginação;
 * - `POST`/`PUT`/`DELETE` exigem professor e recebem o token via `Authorization`;
 * - `autor` nunca é enviado — o backend o obtém do token.
 */

/** `GET /posts` — lista todas as postagens (ordem decrescente de criação). */
export const listarPosts = (signal?: AbortSignal): Promise<Post[]> =>
  request<Post[]>('/posts', { signal });

/**
 * `GET /posts/search?termo=` — busca case-insensitive em título e conteúdo.
 *
 * O termo é codificado com `encodeURIComponent` para não quebrar a query
 * string (espaços, acentos, `&`, `?`, etc.).
 */
export const buscarPosts = (termo: string, signal?: AbortSignal): Promise<Post[]> =>
  request<Post[]>(`/posts/search?termo=${encodeURIComponent(termo)}`, { signal });

/** `GET /posts/:id` — detalhe de uma postagem. */
export const obterPost = (id: string, signal?: AbortSignal): Promise<Post> =>
  request<Post>(`/posts/${encodeURIComponent(id)}`, { signal });

/** `POST /posts` — requer professor. */
export const criarPost = (dados: DadosPost, token: string): Promise<Post> =>
  request<Post>('/posts', {
    method: 'POST',
    body: { titulo: dados.titulo, conteudo: dados.conteudo },
    token,
  });

/** `PUT /posts/:id` — requer professor. */
export const atualizarPost = (id: string, dados: DadosPost, token: string): Promise<Post> =>
  request<Post>(`/posts/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: { titulo: dados.titulo, conteudo: dados.conteudo },
    token,
  });

/** `DELETE /posts/:id` — requer professor. */
export const excluirPost = (id: string, token: string): Promise<RespostaExclusaoPost> =>
  request<RespostaExclusaoPost>(`/posts/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    token,
  });
