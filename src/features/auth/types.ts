/**
 * Tipos do domínio de autenticação.
 *
 * Espelham exatamente os contratos documentados em `docs/api-contracts.md`,
 * derivados do código real do backend.
 */

/** Papéis existentes no backend. */
export type Papel = 'professor' | 'aluno';

/**
 * Usuário como o backend o expõe (`UsuarioPublico`).
 * `passwordHash` nunca é retornado pela API.
 */
export interface Usuario {
  _id: string;
  nome: string;
  email: string;
  role: Papel;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Corpo de `POST /auth/login`. */
export interface CredenciaisLogin {
  email: string;
  senha: string;
}

/** Corpo de `POST /auth/register` (sempre cria aluno; `role` não é enviado). */
export interface DadosCadastroAluno {
  nome: string;
  email: string;
  senha: string;
}

/** Resposta de `POST /auth/login`. */
export interface RespostaLogin {
  token: string;
  usuario: Usuario;
}

/** Resposta de `POST /auth/register` e `GET /auth/me`. */
export interface RespostaUsuario {
  usuario: Usuario;
}

/** Sessão mantida em memória pelo app. */
export interface Sessao {
  token: string;
  usuario: Usuario;
}
