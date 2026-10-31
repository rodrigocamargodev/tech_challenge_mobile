import * as SecureStore from 'expo-secure-store';

import { TOKEN_STORAGE_KEY } from '../config/env';
import { clearToken, getToken, saveToken } from './secureTokenStorage';

const secureStoreMock = SecureStore as unknown as {
  getItemAsync: jest.Mock;
  setItemAsync: jest.Mock;
  deleteItemAsync: jest.Mock;
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('secureTokenStorage', () => {
  it('salva o token na chave configurada', async () => {
    await saveToken('jwt-123');

    expect(secureStoreMock.setItemAsync).toHaveBeenCalledWith(TOKEN_STORAGE_KEY, 'jwt-123');
  });

  it('lê o token salvo', async () => {
    secureStoreMock.getItemAsync.mockResolvedValueOnce('jwt-123');

    await expect(getToken()).resolves.toBe('jwt-123');
    expect(secureStoreMock.getItemAsync).toHaveBeenCalledWith(TOKEN_STORAGE_KEY);
  });

  it('devolve null quando não há token', async () => {
    secureStoreMock.getItemAsync.mockResolvedValueOnce(null);

    await expect(getToken()).resolves.toBeNull();
  });

  it('devolve null quando a leitura falha', async () => {
    secureStoreMock.getItemAsync.mockRejectedValueOnce(new Error('Keychain indisponível'));

    await expect(getToken()).resolves.toBeNull();
  });

  it('remove o token no logout', async () => {
    await clearToken();

    expect(secureStoreMock.deleteItemAsync).toHaveBeenCalledWith(TOKEN_STORAGE_KEY);
  });

  it('não propaga falha ao remover o token', async () => {
    secureStoreMock.deleteItemAsync.mockRejectedValueOnce(new Error('falha'));

    await expect(clearToken()).resolves.toBeUndefined();
  });
});
