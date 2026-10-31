/**
 * Configuração de ambiente do aplicativo.
 *
 * Apenas variáveis com prefixo `EXPO_PUBLIC_` são embutidas no bundle pelo Expo.
 * Nenhum segredo deve ser declarado aqui.
 */

const DEFAULT_API_URL = 'http://10.0.2.2:3000';

/**
 * Normaliza a URL removendo barras finais, para evitar `//` ao concatenar
 * caminhos no cliente HTTP.
 */
const normalizarUrl = (url: string): string => url.trim().replace(/\/+$/, '');

const apiUrlBruta = process.env.EXPO_PUBLIC_API_URL;

/**
 * URL base da API.
 * Se a variável não estiver definida, usa o padrão do emulador Android
 * (`10.0.2.2`), que é o cenário mais comum de desenvolvimento.
 */
export const API_URL = normalizarUrl(apiUrlBruta?.trim() || DEFAULT_API_URL);

/** Indica se a URL veio de configuração explícita ou do fallback. */
export const API_URL_IS_FALLBACK = !apiUrlBruta?.trim();

/** Tempo máximo de espera por resposta da API (ms). */
export const REQUEST_TIMEOUT_MS = 15_000;

/** Chave usada no Expo SecureStore para o token JWT. */
export const TOKEN_STORAGE_KEY = 'blogdegiz.token';
