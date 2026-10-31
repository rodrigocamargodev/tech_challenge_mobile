import { z } from 'zod';

/**
 * Schema de validação do formulário de postagem.
 *
 * As regras espelham a validação real do backend:
 * - `titulo`: 1–200 caracteres, com `trim`;
 * - `conteudo`: 1–20000 caracteres, com `trim`.
 *
 * A validação no app é apenas conveniência de UX. A autoridade final é sempre
 * o backend, que responde `422` com `detalhes` por campo.
 */
export const postSchema = z.object({
  titulo: z
    .string()
    .trim()
    .min(1, 'Informe o título da postagem.')
    .max(200, 'O título deve ter no máximo 200 caracteres.'),
  conteudo: z
    .string()
    .trim()
    .min(1, 'Informe o conteúdo da postagem.')
    .max(20000, 'O conteúdo deve ter no máximo 20000 caracteres.'),
});

export type PostFormData = z.input<typeof postSchema>;
