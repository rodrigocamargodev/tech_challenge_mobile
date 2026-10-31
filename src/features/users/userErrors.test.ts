import { ApiError } from '@/core/http/ApiError';

import { traduzirErroUsuario } from './userErrors';

describe('traduzirErroUsuario', () => {
  it('trata 401 como sessão expirada', () => {
    const erro = new ApiError({ kind: 'http', status: 401, message: 'Token inválido.' });

    expect(traduzirErroUsuario(erro, 'lista').mensagem).toMatch(/sessão expirou/i);
  });

  it('trata 403 genérico como falta de permissão', () => {
    const erro = new ApiError({
      kind: 'http',
      status: 403,
      message: 'Acesso negado. Permissão insuficiente.',
    });

    expect(traduzirErroUsuario(erro, 'lista').mensagem).toMatch(/não tem permissão/i);
  });

  it('preserva a mensagem quando o 403 é uma regra de negócio', () => {
    const erro = new ApiError({
      kind: 'http',
      status: 403,
      message: 'Você não pode desativar o seu próprio usuário.',
    });

    expect(traduzirErroUsuario(erro, 'desativar').mensagem).toBe(
      'Você não pode desativar o seu próprio usuário.'
    );

    const papel = new ApiError({
      kind: 'http',
      status: 403,
      message: 'Você não pode alterar o seu próprio papel.',
    });

    expect(traduzirErroUsuario(papel, 'editar').mensagem).toBe(
      'Você não pode alterar o seu próprio papel.'
    );
  });

  it('trata 404 com mensagem específica do detalhe', () => {
    const erro = new ApiError({ kind: 'http', status: 404, message: 'Usuário não encontrado.' });

    expect(traduzirErroUsuario(erro, 'detalhe').mensagem).toMatch(/não existe mais/i);
    expect(traduzirErroUsuario(erro, 'editar').mensagem).toMatch(/não foi encontrado/i);
  });

  it('trata 409 associando o erro ao campo email', () => {
    const erro = new ApiError({
      kind: 'http',
      status: 409,
      message: 'Já existe um usuário cadastrado com este e-mail.',
    });

    const traduzido = traduzirErroUsuario(erro, 'criar');

    expect(traduzido.mensagem).toMatch(/já existe um usuário/i);
    expect(traduzido.campos.email).toBe('Este e-mail já está em uso.');
  });

  it('mapeia detalhes de 422 por campo', () => {
    const erro = new ApiError({
      kind: 'http',
      status: 422,
      message: 'Dados inválidos na requisição.',
      detalhes: [
        { campo: 'senha', mensagem: 'A senha deve ter no mínimo 8 caracteres.' },
        { campo: 'senha', mensagem: 'Duplicada ignorada.' },
        { campo: 'role', mensagem: "O papel deve ser 'professor' ou 'aluno'." },
      ],
    });

    const traduzido = traduzirErroUsuario(erro, 'criar');

    expect(traduzido.mensagem).toBe('Dados inválidos na requisição.');
    expect(traduzido.campos).toEqual({
      senha: 'A senha deve ter no mínimo 8 caracteres.',
      role: "O papel deve ser 'professor' ou 'aluno'.",
    });
  });

  it('trata erro de rede', () => {
    const erro = new ApiError({ kind: 'network', message: 'Falha de rede.' });

    expect(traduzirErroUsuario(erro, 'lista').mensagem).toMatch(/conectar ao servidor/i);
  });

  it('usa mensagem padrão para erros desconhecidos', () => {
    expect(traduzirErroUsuario(new Error('boom'), 'lista').mensagem).toMatch(
      /não foi possível concluir/i
    );
  });
});
