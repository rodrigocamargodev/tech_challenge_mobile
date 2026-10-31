import { request } from '@/core/http/client';

import type {
  DadosCriacaoUsuario,
  DadosEdicaoUsuario,
  Papel,
  RespostaDesativacaoUsuario,
  UsuarioPublico,
} from './types';

/**
 * Serviço de usuários.
 *
 * Apenas transporte HTTP. Todas as rotas `/users` exigem professor autenticado
 * — o token é sempre enviado e o backend continua sendo a autoridade final
 * (responde `403` para aluno ou para regra de negócio violada).
 *
 * Observações do contrato (ver `docs/api-contracts.md`, seção 4):
 * - a listagem aceita **somente** o filtro `role`; não há paginação nem busca;
 * - `DELETE /users/:id` é desativação lógica, não exclusão definitiva;
 * - reativação é feita por `PUT /users/:id` com `{ ativo: true }`.
 */

export interface OpcoesListagemUsuarios {
  token: string;
  /** Filtro opcional aplicado pelo backend (`?role=`). */
  papel?: Papel;
  signal?: AbortSignal;
}

/**
 * `GET /users?role=` — lista usuários ordenados por nome.
 *
 * Quando `papel` é omitido, o backend devolve professores e alunos juntos.
 */
export const listarUsuarios = ({
  token,
  papel,
  signal,
}: OpcoesListagemUsuarios): Promise<UsuarioPublico[]> =>
  request<UsuarioPublico[]>(papel ? `/users?role=${papel}` : '/users', { token, signal });

/** `GET /users/:id` — detalhe de um usuário. */
export const obterUsuario = (
  id: string,
  token: string,
  signal?: AbortSignal
): Promise<UsuarioPublico> =>
  request<UsuarioPublico>(`/users/${encodeURIComponent(id)}`, { token, signal });

/** `POST /users` — professor cria professor ou aluno. */
export const criarUsuario = (
  dados: DadosCriacaoUsuario,
  token: string
): Promise<UsuarioPublico> =>
  request<UsuarioPublico>('/users', {
    method: 'POST',
    body: {
      nome: dados.nome,
      email: dados.email,
      senha: dados.senha,
      role: dados.role,
    },
    token,
  });

/**
 * `PUT /users/:id` — atualização parcial.
 *
 * Apenas os campos presentes no objeto são enviados; `undefined` é descartado
 * na serialização, preservando o valor atual no backend.
 */
export const atualizarUsuario = (
  id: string,
  dados: DadosEdicaoUsuario,
  token: string
): Promise<UsuarioPublico> =>
  request<UsuarioPublico>(`/users/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: dados,
    token,
  });

/** `DELETE /users/:id` — desativação lógica (`ativo: false`). */
export const desativarUsuario = (
  id: string,
  token: string
): Promise<RespostaDesativacaoUsuario> =>
  request<RespostaDesativacaoUsuario>(`/users/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    token,
  });
