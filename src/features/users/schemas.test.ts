import { montarDadosUsuario, rotuloPapel, rotuloPapelPlural, usuarioSchema } from './schemas';

describe('rotuloPapel', () => {
  it('rotula os papéis no singular', () => {
    expect(rotuloPapel('professor')).toBe('Professor');
    expect(rotuloPapel('aluno')).toBe('Aluno');
  });
});

describe('rotuloPapelPlural', () => {
  it('rotula os papéis no plural com grafia correta', () => {
    expect(rotuloPapelPlural('professor')).toBe('professores');
    expect(rotuloPapelPlural('aluno')).toBe('alunos');
  });
});

describe('usuarioSchema', () => {
  it('exige senha no modo criação', () => {
    const resultado = usuarioSchema('criacao').safeParse({
      nome: 'Maria Silva',
      email: 'maria@escola.com',
      senha: '',
    });

    expect(resultado.success).toBe(false);
  });

  it('aceita senha vazia no modo edição (mantém a atual)', () => {
    const resultado = usuarioSchema('edicao').safeParse({
      nome: 'Maria Silva',
      email: 'maria@escola.com',
      senha: '',
    });

    expect(resultado.success).toBe(true);
  });

  it('rejeita senha curta no modo edição quando preenchida', () => {
    const resultado = usuarioSchema('edicao').safeParse({
      nome: 'Maria Silva',
      email: 'maria@escola.com',
      senha: 'curta',
    });

    expect(resultado.success).toBe(false);
  });
});

describe('montarDadosUsuario', () => {
  it('inclui senha e papel na criação', () => {
    expect(
      montarDadosUsuario(
        { nome: '  Maria Silva  ', email: ' maria@escola.com ', senha: 'senhaSegura123' },
        'aluno',
        'criacao'
      )
    ).toEqual({
      nome: 'Maria Silva',
      email: 'maria@escola.com',
      senha: 'senhaSegura123',
      role: 'aluno',
    });
  });

  it('omite a senha na edição quando o campo está vazio', () => {
    const dados = montarDadosUsuario(
      { nome: 'Maria Silva', email: 'maria@escola.com', senha: '' },
      'professor',
      'edicao'
    );

    expect(dados).toEqual({
      nome: 'Maria Silva',
      email: 'maria@escola.com',
      role: 'professor',
    });
    expect(dados).not.toHaveProperty('senha');
  });

  it('inclui a senha na edição quando informada', () => {
    const dados = montarDadosUsuario(
      { nome: 'Maria Silva', email: 'maria@escola.com', senha: 'novaSenha123' },
      'aluno',
      'edicao'
    );

    expect(dados).toMatchObject({ senha: 'novaSenha123' });
  });
});
