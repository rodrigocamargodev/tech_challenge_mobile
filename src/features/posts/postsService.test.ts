import {
  atualizarPost,
  buscarPosts,
  criarPost,
  excluirPost,
  listarPosts,
  obterPost,
} from './postsService';

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

const post = {
  _id: 'p1',
  titulo: 'Introdução ao Node.js',
  conteudo: 'Nesta aula veremos…',
  autor: 'João Professor',
  criadoEm: '2026-01-01T00:00:00.000Z',
  atualizadoEm: '2026-01-01T00:00:00.000Z',
};

const ultimaChamada = () => fetchMock.mock.calls[0] as [string, RequestInit];

describe('postsService', () => {
  it('lista posts com GET /posts sem token', async () => {
    fetchMock.mockResolvedValue(respostaJson(200, [post]));

    await expect(listarPosts()).resolves.toEqual([post]);

    const [url, init] = ultimaChamada();
    expect(url).toMatch(/\/posts$/);
    expect(init.method).toBe('GET');
    expect((init.headers as Record<string, string>).Authorization).toBeUndefined();
  });

  it('codifica o termo de busca com encodeURIComponent', async () => {
    fetchMock.mockResolvedValue(respostaJson(200, []));

    await buscarPosts('lousa & giz?');

    const [url] = ultimaChamada();
    expect(url).toContain('/posts/search?termo=');
    expect(url).toContain(encodeURIComponent('lousa & giz?'));
    // O termo bruto não pode aparecer sem codificação.
    expect(url).not.toContain('lousa & giz?');
  });

  it('busca posts com acentos preservados na codificação', async () => {
    fetchMock.mockResolvedValue(respostaJson(200, []));

    await buscarPosts('introdução');

    const [url] = ultimaChamada();
    expect(url).toContain(encodeURIComponent('introdução'));
  });

  it('obtém o detalhe em GET /posts/:id', async () => {
    fetchMock.mockResolvedValue(respostaJson(200, post));

    await expect(obterPost('p1')).resolves.toEqual(post);
    expect(ultimaChamada()[0]).toMatch(/\/posts\/p1$/);
  });

  it('cria post enviando apenas titulo e conteudo com Bearer', async () => {
    fetchMock.mockResolvedValue(respostaJson(201, post));

    await criarPost({ titulo: 'Título', conteudo: 'Conteúdo' }, 'token-prof');

    const [url, init] = ultimaChamada();
    const headers = init.headers as Record<string, string>;

    expect(url).toMatch(/\/posts$/);
    expect(init.method).toBe('POST');
    expect(headers.Authorization).toBe('Bearer token-prof');
    expect(JSON.parse(init.body as string)).toEqual({
      titulo: 'Título',
      conteudo: 'Conteúdo',
    });
    // `autor` nunca é enviado: o backend o deriva do token.
    expect(JSON.parse(init.body as string)).not.toHaveProperty('autor');
  });

  it('atualiza post com PUT /posts/:id', async () => {
    fetchMock.mockResolvedValue(respostaJson(200, post));

    await atualizarPost('p1', { titulo: 'Novo', conteudo: 'Novo conteúdo' }, 'token-prof');

    const [url, init] = ultimaChamada();
    expect(url).toMatch(/\/posts\/p1$/);
    expect(init.method).toBe('PUT');
    expect(JSON.parse(init.body as string)).toEqual({
      titulo: 'Novo',
      conteudo: 'Novo conteúdo',
    });
  });

  it('exclui post com DELETE /posts/:id', async () => {
    fetchMock.mockResolvedValue(
      respostaJson(200, { message: 'Postagem excluída com sucesso!' })
    );

    await expect(excluirPost('p1', 'token-prof')).resolves.toEqual({
      message: 'Postagem excluída com sucesso!',
    });

    const [url, init] = ultimaChamada();
    expect(url).toMatch(/\/posts\/p1$/);
    expect(init.method).toBe('DELETE');
  });

  it('propaga 404 como ApiError', async () => {
    fetchMock.mockResolvedValue(
      respostaJson(404, { error: 'Postagem não encontrada.' })
    );

    await expect(obterPost('inexistente')).rejects.toMatchObject({
      status: 404,
      message: 'Postagem não encontrada.',
    });
  });
});
