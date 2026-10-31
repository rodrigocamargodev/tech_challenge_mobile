/**
 * A configuração é lida no carregamento do módulo, então cada cenário
 * recarrega o módulo com `jest.isolateModules`.
 */
const carregarEnv = (apiUrl?: string) => {
  const anterior = process.env.EXPO_PUBLIC_API_URL;

  if (apiUrl === undefined) {
    delete process.env.EXPO_PUBLIC_API_URL;
  } else {
    process.env.EXPO_PUBLIC_API_URL = apiUrl;
  }

  let modulo: typeof import('./env') | undefined;
  jest.isolateModules(() => {
    // `require` é obrigatório aqui: `jest.isolateModules` só isola módulos
    // carregados de forma síncrona dentro do callback.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    modulo = require('./env') as typeof import('./env');
  });

  if (anterior === undefined) {
    delete process.env.EXPO_PUBLIC_API_URL;
  } else {
    process.env.EXPO_PUBLIC_API_URL = anterior;
  }

  if (!modulo) throw new Error('Falha ao carregar o módulo de ambiente.');
  return modulo;
};

describe('configuração de ambiente', () => {
  it('usa a URL definida em EXPO_PUBLIC_API_URL', () => {
    const env = carregarEnv('https://api.exemplo.com');

    expect(env.API_URL).toBe('https://api.exemplo.com');
    expect(env.API_URL_IS_FALLBACK).toBe(false);
  });

  it('remove barras finais da URL', () => {
    const env = carregarEnv('http://10.0.2.2:3000///');

    expect(env.API_URL).toBe('http://10.0.2.2:3000');
  });

  it('usa o padrão do emulador Android quando a variável não existe', () => {
    const env = carregarEnv(undefined);

    expect(env.API_URL).toBe('http://10.0.2.2:3000');
    expect(env.API_URL_IS_FALLBACK).toBe(true);
  });

  it('usa o padrão quando a variável está vazia', () => {
    const env = carregarEnv('   ');

    expect(env.API_URL).toBe('http://10.0.2.2:3000');
    expect(env.API_URL_IS_FALLBACK).toBe(true);
  });

  it('expõe a chave de armazenamento do token', () => {
    const env = carregarEnv(undefined);

    expect(env.TOKEN_STORAGE_KEY).toBe('blogdegiz.token');
  });
});
