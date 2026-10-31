import { buscarUsuarioAutenticado, cadastrarAluno, login } from './authService';

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

const lerChamada = (indice = 0): { url: string; init: RequestInit } => {
  const [url, init] = fetchMock.mock.calls[indice] as [string, RequestInit];
  return { url, init };
};

describe('authService', () => {
  it('envia apenas email e senha no login', async () => {
    fetchMock.mockResolvedValue(
      respostaJson(200, { token: 'jwt', usuario: { _id: '1', role: 'aluno' } })
    );

    const resultado = await login({ email: 'maria@escola.com', senha: 'senhaSegura123' });

    const { url, init } = lerChamada();
    expect(url).toMatch(/\/auth\/login$/);
    expect(init.method).toBe('POST');
    expect(JSON.parse(String(init.body))).toEqual({
      email: 'maria@escola.com',
      senha: 'senhaSegura123',
    });
    expect(resultado.token).toBe('jwt');
  });

  it('não envia role no cadastro público', async () => {
    fetchMock.mockResolvedValue(respostaJson(201, { usuario: { _id: '1', role: 'aluno' } }));

    await cadastrarAluno({ nome: 'Maria', email: 'maria@escola.com', senha: 'senhaSegura123' });

    const { url, init } = lerChamada();
    expect(url).toMatch(/\/auth\/register$/);
    expect(init.method).toBe('POST');

    const corpo = JSON.parse(String(init.body)) as Record<string, unknown>;
    expect(corpo).toEqual({
      nome: 'Maria',
      email: 'maria@escola.com',
      senha: 'senhaSegura123',
    });
    expect(corpo).not.toHaveProperty('role');
  });

  it('envia o token Bearer em /auth/me', async () => {
    fetchMock.mockResolvedValue(respostaJson(200, { usuario: { _id: '1' } }));

    await buscarUsuarioAutenticado('token-abc');

    const { url, init } = lerChamada();
    expect(url).toMatch(/\/auth\/me$/);
    expect(init.method).toBe('GET');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer token-abc');
  });
});
