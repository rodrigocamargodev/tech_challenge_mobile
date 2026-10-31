import { ApiError } from '@/core/http/ApiError';

import { traduzirErroAuth } from './authErrors';

describe('traduzirErroAuth', () => {
  it('traduz 401 de login como credenciais inválidas', () => {
    const erro = new ApiError({ kind: 'http', status: 401, message: 'E-mail ou senha inválidos.' });

    expect(traduzirErroAuth(erro, 'login')).toEqual({
      mensagem: 'E-mail ou senha inválidos.',
      campos: {},
    });
  });

  it('traduz 403 como conta desativada', () => {
    const erro = new ApiError({ kind: 'http', status: 403, message: 'Usuário desativado.' });

    expect(traduzirErroAuth(erro, 'login').mensagem).toMatch(/desativada/i);
  });

  it('traduz 429 com orientação para aguardar', () => {
    const erro = new ApiError({
      kind: 'http',
      status: 429,
      message: 'Muitas tentativas de login. Tente novamente em alguns minutos.',
    });

    const resultado = traduzirErroAuth(erro, 'login');

    expect(resultado.mensagem).toMatch(/Muitas tentativas/i);
    expect(resultado.mensagem).toMatch(/aguarde/i);
  });

  it('traduz 409 de cadastro como e-mail em uso', () => {
    const erro = new ApiError({
      kind: 'http',
      status: 409,
      message: 'Já existe um usuário cadastrado com este e-mail.',
    });

    const resultado = traduzirErroAuth(erro, 'cadastro');

    expect(resultado.mensagem).toMatch(/já existe/i);
    expect(resultado.campos.email).toBeDefined();
  });

  it('mapeia detalhes de 422 para os campos', () => {
    const erro = new ApiError({
      kind: 'http',
      status: 422,
      message: 'Dados inválidos na requisição.',
      detalhes: [
        { campo: 'email', mensagem: 'E-mail inválido.' },
        { campo: 'senha', mensagem: 'A senha deve ter no mínimo 8 caracteres.' },
      ],
    });

    const resultado = traduzirErroAuth(erro, 'cadastro');

    expect(resultado.campos).toEqual({
      email: 'E-mail inválido.',
      senha: 'A senha deve ter no mínimo 8 caracteres.',
    });
  });

  it('traduz falha de rede', () => {
    const erro = new ApiError({ kind: 'network', message: 'Sem conexão.' });

    expect(traduzirErroAuth(erro, 'login').mensagem).toMatch(/conectar ao servidor/i);
  });

  it('devolve mensagem padrão para valores desconhecidos', () => {
    expect(traduzirErroAuth('qualquer coisa', 'login')).toEqual({
      mensagem: 'Não foi possível concluir a operação. Tente novamente.',
      campos: {},
    });
  });
});
