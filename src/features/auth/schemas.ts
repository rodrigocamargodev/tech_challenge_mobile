import { z } from 'zod';

/**
 * Schemas de validação dos formulários de autenticação.
 *
 * As regras espelham a validação real do backend (`AuthController`):
 * - nome: 2–120 caracteres;
 * - email: formato válido, normalizado para minúsculas;
 * - senha: 8–72 caracteres no cadastro.
 *
 * A validação no app é apenas conveniência de UX. A autoridade final é sempre
 * o backend.
 */

// O backend normaliza o e-mail para minúsculas; o app não precisa transformar
// o valor no schema (isso manteria input e output diferentes para o RHF).
const emailSchema = z
  .string()
  .trim()
  .min(1, 'Informe seu e-mail.')
  .pipe(z.email('Informe um e-mail válido.'));

export const loginSchema = z.object({
  email: emailSchema,
  senha: z.string().min(1, 'Informe sua senha.'),
});

export const cadastroSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(2, 'O nome deve ter no mínimo 2 caracteres.')
    .max(120, 'O nome deve ter no máximo 120 caracteres.'),
  email: emailSchema,
  senha: z
    .string()
    .min(8, 'A senha deve ter no mínimo 8 caracteres.')
    .max(72, 'A senha deve ter no máximo 72 caracteres.'),
});

export type LoginFormData = z.input<typeof loginSchema>;
export type CadastroFormData = z.input<typeof cadastroSchema>;
