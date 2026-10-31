import { request } from '@/core/http/client';

import type {
  CredenciaisLogin,
  DadosCadastroAluno,
  RespostaLogin,
  RespostaUsuario,
} from './types';

/**
 * Serviço de autenticação.
 *
 * Apenas transporte HTTP: não guarda estado, não acessa armazenamento e não
 * conhece telas. O estado da sessão é responsabilidade do `AuthProvider`.
 */

/** `POST /auth/login` — público. */
export const login = (credenciais: CredenciaisLogin): Promise<RespostaLogin> =>
  request<RespostaLogin>('/auth/login', {
    method: 'POST',
    body: { email: credenciais.email, senha: credenciais.senha },
  });

/**
 * `POST /auth/register` — público.
 *
 * O backend ignora qualquer `role` enviado e sempre cria um aluno, por isso o
 * campo não é enviado.
 */
export const cadastrarAluno = (dados: DadosCadastroAluno): Promise<RespostaUsuario> =>
  request<RespostaUsuario>('/auth/register', {
    method: 'POST',
    body: { nome: dados.nome, email: dados.email, senha: dados.senha },
  });

/** `GET /auth/me` — requer Bearer. */
export const buscarUsuarioAutenticado = (token: string): Promise<RespostaUsuario> =>
  request<RespostaUsuario>('/auth/me', { token });
