import { ApiError } from '@/core/http/ApiError';

import { traduzirErroPost } from './postErrors';

describe('traduzirErroPost', () => {
  it('trata 401 como sessão expirada', () => {
    const erro = new ApiError({ kind: 'http', status: 401, message: 'Token inválido.' });

    expect(traduzirErroPost(erro, 'lista').mensagem).toMatch(/sessão expirou/i);
  });

  it('trata 403 como falta de permissão', () => {
    const erro = new ApiError({ kind: 'http', status: 403, message: 'Acesso negado.' });

    expect(traduzirErroPost(erro, 'salvar').mensagem).toMatch(/não tem permissão/i);
  });

  it('trata 404 com mensagem específica do detalhe', () => {
    const erro = new ApiError({ kind: 'http', status: 404, message: 'Postagem não encontrada.' });

    expect(traduzirErroPost(erro, 'detalhe').mensagem).toMatch(/não existe mais/i);
    expect(traduzirErroPost(erro, 'excluir').mensagem).toMatch(/não foi encontrada/i);
  });

  it('mapeia detalhes de 422 por campo', () => {
    const erro = new ApiError({
      kind: 'http',
      status: 422,
      message: 'Dados inválidos na requisição.',
      detalhes: [
        { campo: 'titulo', mensagem: 'Título é obrigatório.' },
        { campo: 'titulo', mensagem: 'Mensagem duplicada ignorada.' },
        { campo: 'conteudo', mensagem: 'Conteúdo é obrigatório.' },
      ],
    });

    const traduzido = traduzirErroPost(erro, 'salvar');

    expect(traduzido.mensagem).toBe('Dados inválidos na requisição.');
    expect(traduzido.campos).toEqual({
      titulo: 'Título é obrigatório.',
      conteudo: 'Conteúdo é obrigatório.',
    });
  });

  it('trata 400 com a mensagem do backend', () => {
    const erro = new ApiError({
      kind: 'http',
      status: 400,
      message: 'Identificador inválido: id.',
    });

    expect(traduzirErroPost(erro, 'detalhe').mensagem).toBe('Identificador inválido: id.');
  });

  it('trata erro de rede', () => {
    const erro = new ApiError({ kind: 'network', message: 'Falha de rede.' });

    expect(traduzirErroPost(erro, 'lista').mensagem).toMatch(/conectar ao servidor/i);
  });

  it('usa mensagem padrão para erros desconhecidos', () => {
    expect(traduzirErroPost(new Error('boom'), 'lista').mensagem).toMatch(
      /não foi possível concluir/i
    );
  });
});
