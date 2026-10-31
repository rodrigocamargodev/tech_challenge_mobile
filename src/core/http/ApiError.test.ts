import { ApiError, mensagemDeErro } from './ApiError';

describe('ApiError', () => {
  it('expõe status, detalhes e tipo', () => {
    const erro = new ApiError({
      kind: 'http',
      status: 422,
      message: 'Dados inválidos na requisição.',
      detalhes: [{ campo: 'email', mensagem: 'E-mail inválido.' }],
    });

    expect(erro.name).toBe('ApiError');
    expect(erro.status).toBe(422);
    expect(erro.detalhes).toHaveLength(1);
    expect(erro.isValidationError).toBe(true);
  });

  it('identifica erro de rede', () => {
    const erro = new ApiError({ kind: 'network', message: 'Sem conexão.' });

    expect(erro.isNetworkError).toBe(true);
    expect(erro.status).toBeUndefined();
  });

  it('identifica 401, 403 e 404', () => {
    expect(new ApiError({ kind: 'http', status: 401, message: 'x' }).isUnauthorized).toBe(true);
    expect(new ApiError({ kind: 'http', status: 403, message: 'x' }).isForbidden).toBe(true);
    expect(new ApiError({ kind: 'http', status: 404, message: 'x' }).isNotFound).toBe(true);
  });

  it('não confunde 401 com 403', () => {
    const erro = new ApiError({ kind: 'http', status: 401, message: 'x' });

    expect(erro.isUnauthorized).toBe(true);
    expect(erro.isForbidden).toBe(false);
  });
});

describe('mensagemDeErro', () => {
  it('usa a mensagem do ApiError', () => {
    expect(mensagemDeErro(new ApiError({ kind: 'http', status: 400, message: 'Falhou.' }))).toBe(
      'Falhou.'
    );
  });

  it('usa a mensagem de Error comum', () => {
    expect(mensagemDeErro(new Error('Erro simples'))).toBe('Erro simples');
  });

  it('devolve mensagem padrão para valores desconhecidos', () => {
    expect(mensagemDeErro('texto')).toBe('Ocorreu um erro inesperado. Tente novamente.');
    expect(mensagemDeErro(null)).toBe('Ocorreu um erro inesperado. Tente novamente.');
  });
});
