import { z } from 'zod';

import type { Papel } from './types';

/**
 * Schemas de validação dos formulários de usuário.
 *
 * Espelham a validação do `UserController` do backend:
 * - `nome`: 2–120 caracteres, com `trim`;
 * - `email`: formato válido (o backend normaliza para minúsculas);
 * - `senha`: 8–72 caracteres.
 *
 * No modo `edicao`, a senha é opcional: campo vazio significa "manter a senha
 * atual". A validação local é conveniência de UX — a autoridade final é sempre
 * o backend, que responde `422` com `detalhes` por campo.
 */

const nomeSchema = z
  .string()
  .trim()
  .min(2, 'O nome deve ter no mínimo 2 caracteres.')
  .max(120, 'O nome deve ter no máximo 120 caracteres.');

const emailSchema = z
  .string()
  .trim()
  .min(1, 'Informe o e-mail.')
  .pipe(z.email('Informe um e-mail válido.'));

const senhaObrigatoriaSchema = z
  .string()
  .min(8, 'A senha deve ter no mínimo 8 caracteres.')
  .max(72, 'A senha deve ter no máximo 72 caracteres.');

const senhaOpcionalSchema = z
  .string()
  .refine((valor) => valor === '' || (valor.length >= 8 && valor.length <= 72), {
    message: 'A senha deve ter entre 8 e 72 caracteres.',
  });

export type ModoFormularioUsuario = 'criacao' | 'edicao';

/** Valores controlados pelo React Hook Form (o papel é gerido à parte). */
export interface UsuarioFormValues {
  nome: string;
  email: string;
  senha: string;
}

/**
 * Schema do formulário conforme o modo.
 *
 * Os dois modos produzem o mesmo tipo de saída (`UsuarioFormValues`), o que
 * permite usar um único formulário com um `resolver` escolhido em tempo de
 * renderização.
 */
export const usuarioSchema = (modo: ModoFormularioUsuario) =>
  z.object({
    nome: nomeSchema,
    email: emailSchema,
    senha: modo === 'criacao' ? senhaObrigatoriaSchema : senhaOpcionalSchema,
  });

/** Papéis aceitos pelo backend (`PAPEIS` em `models/User.ts`). */
export const papeis: readonly Papel[] = ['professor', 'aluno'] as const;

/** Rótulos de exibição dos papéis. */
export const rotuloPapel = (papel: Papel): string =>
  papel === 'professor' ? 'Professor' : 'Aluno';

/** Rótulos no plural, para textos de filtro e contagem. */
export const rotuloPapelPlural = (papel: Papel): string =>
  papel === 'professor' ? 'professores' : 'alunos';

/**
 * Converte os valores do formulário no corpo aceito pela API.
 *
 * Na edição, senha vazia é removida do corpo (não sobrescreve a atual).
 */
export const montarDadosUsuario = (
  valores: UsuarioFormValues,
  papel: Papel,
  modo: ModoFormularioUsuario
) => {
  const base = { nome: valores.nome.trim(), email: valores.email.trim() };

  if (modo === 'criacao') {
    return { ...base, senha: valores.senha, role: papel };
  }

  return {
    ...base,
    role: papel,
    ...(valores.senha !== '' ? { senha: valores.senha } : {}),
  };
};
