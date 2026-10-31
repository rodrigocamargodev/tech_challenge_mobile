import { resetUnauthorizedListeners, subscribeToUnauthorized } from './authEvents';
import { request } from './client';

const fetchMock = jest.fn();

beforeEach(() => {
  fetchMock.mockReset();
  resetUnauthorizedListeners();
  globalThis.fetch = fetchMock as unknown as typeof fetch;
});

const respostaJson = (status: number, corpo: unknown): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(corpo),
  }) as unknown as Response;

describe('tratamento centralizado de 401', () => {
  it('publica evento quando uma requisição autenticada recebe 401', async () => {
    const ouvinte = jest.fn();
    subscribeToUnauthorized(ouvinte);

    fetchMock.mockResolvedValue(respostaJson(401, { error: 'Token inválido ou expirado.' }));

    await expect(request('/auth/me', { token: 'token-expirado' })).rejects.toMatchObject({
      status: 401,
    });

    expect(ouvinte).toHaveBeenCalledTimes(1);
  });

  it('não publica evento em 401 de requisição anônima (login)', async () => {
    const ouvinte = jest.fn();
    subscribeToUnauthorized(ouvinte);

    fetchMock.mockResolvedValue(respostaJson(401, { error: 'E-mail ou senha inválidos.' }));

    await expect(
      request('/auth/login', { method: 'POST', body: { email: 'a@b.com', senha: 'x' } })
    ).rejects.toMatchObject({ status: 401 });

    expect(ouvinte).not.toHaveBeenCalled();
  });

  it('não publica evento em 403 (autorização, não autenticação)', async () => {
    const ouvinte = jest.fn();
    subscribeToUnauthorized(ouvinte);

    fetchMock.mockResolvedValue(respostaJson(403, { error: 'Acesso negado.' }));

    await expect(request('/posts', { method: 'POST', token: 'token', body: {} })).rejects.toMatchObject(
      { status: 403 }
    );

    expect(ouvinte).not.toHaveBeenCalled();
  });

  it('permite cancelar a inscrição', async () => {
    const ouvinte = jest.fn();
    const cancelar = subscribeToUnauthorized(ouvinte);
    cancelar();

    fetchMock.mockResolvedValue(respostaJson(401, { error: 'x' }));

    await expect(request('/auth/me', { token: 'token' })).rejects.toMatchObject({ status: 401 });

    expect(ouvinte).not.toHaveBeenCalled();
  });

  it('propaga 429 como erro de limite de tentativas', async () => {
    fetchMock.mockResolvedValue(
      respostaJson(429, {
        error: 'Muitas tentativas de login. Tente novamente em alguns minutos.',
      })
    );

    const erro = await request('/auth/login', { method: 'POST', body: {} }).catch(
      (e: unknown) => e
    );

    expect(erro).toMatchObject({ status: 429 });
    expect((erro as { isRateLimited: boolean }).isRateLimited).toBe(true);
  });
});
