import { TOKEN_STORAGE_KEY } from '../config/env';

/**
 * Testa o ramo web do armazenamento de token.
 *
 * No navegador, `expo-secure-store` não implementa armazenamento (o módulo web
 * é um objeto vazio). O app usa `sessionStorage` apenas para pré-visualização
 * em desenvolvimento; em iOS/Android continua usando SecureStore.
 *
 * `Platform.OS` é lido no carregamento do módulo, então cada cenário recarrega
 * o módulo com `jest.isolateModules` e `Platform.OS` sobrescrito.
 */
const carregarModuloWeb = () => {
  let modulo: typeof import('./secureTokenStorage') | undefined;

  jest.isolateModules(() => {
    jest.doMock('react-native', () => ({
      Platform: { OS: 'web' },
    }));

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    modulo = require('./secureTokenStorage') as typeof import('./secureTokenStorage');
  });

  if (!modulo) throw new Error('Falha ao carregar o módulo de armazenamento.');
  return modulo;
};

/**
 * Implementação mínima de `sessionStorage` para o ambiente Jest (que não
 * fornece Web Storage). Suficiente para exercitar o ramo web do módulo.
 */
const criarSessionStorageFake = (): Storage => {
  const dados = new Map<string, string>();

  return {
    get length() {
      return dados.size;
    },
    clear: () => dados.clear(),
    getItem: (chave: string) => dados.get(chave) ?? null,
    key: (indice: number) => [...dados.keys()][indice] ?? null,
    removeItem: (chave: string) => {
      dados.delete(chave);
    },
    setItem: (chave: string, valor: string) => {
      dados.set(chave, valor);
    },
  };
};

describe('secureTokenStorage (web)', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'sessionStorage', {
      value: criarSessionStorageFake(),
      configurable: true,
      writable: true,
    });
    jest.resetModules();
  });

  afterEach(() => {
    jest.dontMock('react-native');
  });

  it('salva e lê o token no sessionStorage', async () => {
    const { saveToken, getToken } = carregarModuloWeb();

    await saveToken('jwt-web');

    expect(globalThis.sessionStorage.getItem(TOKEN_STORAGE_KEY)).toBe('jwt-web');
    await expect(getToken()).resolves.toBe('jwt-web');
  });

  it('devolve null quando não há token', async () => {
    const { getToken } = carregarModuloWeb();

    await expect(getToken()).resolves.toBeNull();
  });

  it('remove o token no logout', async () => {
    const { saveToken, clearToken, getToken } = carregarModuloWeb();

    await saveToken('jwt-web');
    await clearToken();

    expect(globalThis.sessionStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
    await expect(getToken()).resolves.toBeNull();
  });

  it('não quebra quando o sessionStorage está indisponível', async () => {
    const original = globalThis.sessionStorage;
    // Simula ambiente sem sessionStorage (ex.: SSR).
    Object.defineProperty(globalThis, 'sessionStorage', {
      value: undefined,
      configurable: true,
    });

    try {
      const { saveToken, getToken, clearToken } = carregarModuloWeb();

      await expect(saveToken('jwt')).resolves.toBeUndefined();
      await expect(getToken()).resolves.toBeNull();
      await expect(clearToken()).resolves.toBeUndefined();
    } finally {
      Object.defineProperty(globalThis, 'sessionStorage', {
        value: original,
        configurable: true,
      });
    }
  });
});
