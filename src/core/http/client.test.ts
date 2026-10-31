import { ApiError } from './ApiError';
import { request } from './client';

const fetchMock = jest.fn();

beforeEach(() => {
  fetchMock.mockReset();
  globalThis.fetch = fetchMock as unknown as typeof fetch;
});

const respostaJson = (status: number, corpo: unknown): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(corpo),
  }) as unknown as Response;

describe('request', () => {
  it('envia GET com Accept e devolve o corpo tipado', async () => {
    fetchMock.mockResolvedValue(respostaJson(200, [{ _id: '1', titulo: 'Aula' }]));

    const dados = await request<{ _id: string; titulo: string }[]>('/posts');

    expect(dados).toEqual([{ _id: '1', titulo: 'Aula' }]);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toMatch(/\/posts$/);
    expect(init.method).toBe('GET');
    expect((init.headers as Record<string, string>).Accept).toBe('application/json');
    expect((init.headers as Record<string, string>).Authorization).toBeUndefined();
    expect(init.body).toBeUndefined();
  });

  it('envia JSON e token Bearer quando fornecidos', async () => {
    fetchMock.mockResolvedValue(respostaJson(201, { _id: '1' }));

    await request('/posts', {
      method: 'POST',
      body: { titulo: 'Nova', conteudo: 'Texto' },
      token: 'token-abc',
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;

    expect(init.method).toBe('POST');
    expect(headers['Content-Type']).toBe('application/json');
    expect(headers.Authorization).toBe('Bearer token-abc');
    expect(init.body).toBe(JSON.stringify({ titulo: 'Nova', conteudo: 'Texto' }));
  });

  it('converte erro HTTP em ApiError com status e detalhes', async () => {
    fetchMock.mockResolvedValue(
      respostaJson(422, {
        error: 'Dados inválidos na requisição.',
        detalhes: [{ campo: 'email', mensagem: 'E-mail inválido.' }],
      })
    );

    await expect(request('/auth/register', { method: 'POST', body: {} })).rejects.toMatchObject({
      name: 'ApiError',
      kind: 'http',
      status: 422,
      message: 'Dados inválidos na requisição.',
      detalhes: [{ campo: 'email', mensagem: 'E-mail inválido.' }],
    });
  });

  it('usa mensagem genérica quando o erro não traz envelope conhecido', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error',
    } as unknown as Response);

    await expect(request('/posts')).rejects.toMatchObject({
      status: 500,
      message: 'O servidor encontrou um erro. Tente novamente mais tarde.',
    });
  });

  it('converte falha de rede em ApiError de rede', async () => {
    fetchMock.mockRejectedValue(new TypeError('Network request failed'));

    const erro = await request('/posts').catch((e: unknown) => e);

    expect(erro).toBeInstanceOf(ApiError);
    expect((erro as ApiError).isNetworkError).toBe(true);
    expect((erro as ApiError).message).toMatch(/conectar ao servidor/i);
  });

  it('trata corpo vazio como null em respostas de sucesso', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 204,
      text: async () => '',
    } as unknown as Response);

    await expect(request('/posts/1', { method: 'DELETE' })).resolves.toBeNull();
  });

  it('propaga cancelamento externo como ApiError', async () => {
    const controller = new AbortController();
    fetchMock.mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () => {
            const erro = new Error('Aborted');
            erro.name = 'AbortError';
            reject(erro);
          });
        })
    );

    const promessa = request('/posts', { signal: controller.signal });
    controller.abort();

    await expect(promessa).rejects.toMatchObject({ message: 'Requisição cancelada.' });
  });
});
