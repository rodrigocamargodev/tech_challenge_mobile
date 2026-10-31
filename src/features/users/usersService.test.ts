import {
  atualizarUsuario,
  criarUsuario,
  desativarUsuario,
  listarUsuarios,
  obterUsuario,
} from './usersService';

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

const usuario = {
  _id: 'u1',
  nome: 'Maria Silva',
  email: 'maria@escola.com',
  role: 'aluno',
  ativo: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const ultimaChamada = () => fetchMock.mock.calls[0] as [string, RequestInit];

describe('usersService', () => {
  it('lista usuários sem filtro em GET /users', async () => {
    fetchMock.mockResolvedValue(respostaJson(200, [usuario]));

    await expect(listarUsuarios({ token: 'token-prof' })).resolves.toEqual([usuario]);

    const [url, init] = ultimaChamada();
    expect(url).toMatch(/\/users$/);
    expect(url).not.toContain('role=');
    expect(init.method).toBe('GET');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer token-prof');
  });

  it('envia o filtro de papel como query string', async () => {
    fetchMock.mockResolvedValue(respostaJson(200, []));

    await listarUsuarios({ token: 'token-prof', papel: 'professor' });

    expect(ultimaChamada()[0]).toMatch(/\/users\?role=professor$/);
  });

  it('obtém o detalhe em GET /users/:id', async () => {
    fetchMock.mockResolvedValue(respostaJson(200, usuario));

    await expect(obterUsuario('u1', 'token-prof')).resolves.toEqual(usuario);
    expect(ultimaChamada()[0]).toMatch(/\/users\/u1$/);
  });

  it('cria usuário enviando nome, email, senha e papel', async () => {
    fetchMock.mockResolvedValue(respostaJson(201, usuario));

    await criarUsuario(
      {
        nome: 'Maria Silva',
        email: 'maria@escola.com',
        senha: 'senhaSegura123',
        role: 'aluno',
      },
      'token-prof'
    );

    const [url, init] = ultimaChamada();
    expect(url).toMatch(/\/users$/);
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({
      nome: 'Maria Silva',
      email: 'maria@escola.com',
      senha: 'senhaSegura123',
      role: 'aluno',
    });
  });

  it('atualiza usuário com PUT /users/:id sem campos ausentes', async () => {
    fetchMock.mockResolvedValue(respostaJson(200, usuario));

    await atualizarUsuario('u1', { nome: 'Nome Novo', role: 'aluno' }, 'token-prof');

    const [url, init] = ultimaChamada();
    expect(url).toMatch(/\/users\/u1$/);
    expect(init.method).toBe('PUT');
    expect(JSON.parse(init.body as string)).toEqual({ nome: 'Nome Novo', role: 'aluno' });
  });

  it('desativa usuário com DELETE /users/:id', async () => {
    fetchMock.mockResolvedValue(
      respostaJson(200, { message: 'Usuário desativado com sucesso.', usuario })
    );

    await expect(desativarUsuario('u1', 'token-prof')).resolves.toMatchObject({
      message: 'Usuário desativado com sucesso.',
    });

    const [url, init] = ultimaChamada();
    expect(url).toMatch(/\/users\/u1$/);
    expect(init.method).toBe('DELETE');
  });

  it('propaga 403 como ApiError', async () => {
    fetchMock.mockResolvedValue(respostaJson(403, { error: 'Acesso negado.' }));

    await expect(listarUsuarios({ token: 'token-aluno' })).rejects.toMatchObject({
      status: 403,
      message: 'Acesso negado.',
    });
  });
});
