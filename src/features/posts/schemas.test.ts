import { postSchema } from './schemas';

describe('postSchema', () => {
  it('aceita título e conteúdo válidos', () => {
    const resultado = postSchema.safeParse({
      titulo: 'Introdução ao Node.js',
      conteudo: 'Nesta aula veremos os fundamentos.',
    });

    expect(resultado.success).toBe(true);
  });

  it('rejeita título vazio', () => {
    const resultado = postSchema.safeParse({ titulo: '   ', conteudo: 'Conteúdo' });

    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.error.issues[0]?.message).toBe('Informe o título da postagem.');
    }
  });

  it('rejeita conteúdo vazio', () => {
    const resultado = postSchema.safeParse({ titulo: 'Título', conteudo: '' });

    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.error.issues[0]?.message).toBe('Informe o conteúdo da postagem.');
    }
  });

  it('rejeita título acima de 200 caracteres', () => {
    const resultado = postSchema.safeParse({
      titulo: 'a'.repeat(201),
      conteudo: 'Conteúdo',
    });

    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.error.issues[0]?.message).toBe(
        'O título deve ter no máximo 200 caracteres.'
      );
    }
  });

  it('rejeita conteúdo acima de 20000 caracteres', () => {
    const resultado = postSchema.safeParse({
      titulo: 'Título',
      conteudo: 'a'.repeat(20001),
    });

    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.error.issues[0]?.message).toBe(
        'O conteúdo deve ter no máximo 20000 caracteres.'
      );
    }
  });
});
