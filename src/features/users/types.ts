import type { Papel, Usuario } from '@/features/auth/types';

/**
 * Tipos do domínio de usuários.
 *
 * O backend expõe exatamente o mesmo formato usado em autenticação
 * (`UsuarioPublico`), por isso o tipo é reutilizado em vez de duplicado:
 * `_id`, `nome`, `email`, `role`, `ativo`, `createdAt`, `updatedAt`.
 * `passwordHash` nunca é retornado pela API.
 */
export type UsuarioPublico = Usuario;

export type { Papel };

/** Corpo de `POST /users` (requer professor autenticado). */
export interface DadosCriacaoUsuario {
  nome: string;
  email: string;
  senha: string;
  role: Papel;
}

/**
 * Corpo de `PUT /users/:id` (requer professor autenticado).
 *
 * Todos os campos são opcionais; campos ausentes não são alterados.
 * Regras do backend: ninguém altera o próprio `role` e ninguém desativa o
 * próprio usuário (`403`).
 */
export interface DadosEdicaoUsuario {
  nome?: string;
  email?: string;
  senha?: string;
  role?: Papel;
  ativo?: boolean;
}

/**
 * Resposta de `DELETE /users/:id`.
 *
 * A rota é uma **desativação lógica**: o documento permanece no banco com
 * `ativo: false`. Não existe exclusão definitiva na API.
 */
export interface RespostaDesativacaoUsuario {
  message: string;
  usuario: UsuarioPublico;
}
