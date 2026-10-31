import { API_URL, REQUEST_TIMEOUT_MS } from '../config/env';
import { ApiError, type ApiErrorDetalhe } from './ApiError';
import { emitUnauthorized } from './authEvents';

/**
 * Cliente HTTP central.
 *
 * Responsabilidades:
 * - montar a URL base e os cabeçalhos;
 * - injetar o token Bearer quando houver sessão;
 * - aplicar timeout;
 * - normalizar erros em `ApiError`.
 *
 * Não conhece regras de negócio nem telas.
 */

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  /** Token JWT a ser enviado em `Authorization: Bearer`. */
  token?: string | null;
  /** Permite cancelar a requisição (usado pelo TanStack Query). */
  signal?: AbortSignal;
}

/** Envelope de erro documentado do backend. */
interface CorpoErroApi {
  error?: unknown;
  detalhes?: unknown;
}

const extrairDetalhes = (valor: unknown): ApiErrorDetalhe[] | undefined => {
  if (!Array.isArray(valor)) return undefined;

  const detalhes = valor.flatMap((item): ApiErrorDetalhe[] => {
    if (typeof item !== 'object' || item === null) return [];
    const { campo, mensagem } = item as { campo?: unknown; mensagem?: unknown };
    if (typeof campo !== 'string' || typeof mensagem !== 'string') return [];
    return [{ campo, mensagem }];
  });

  return detalhes.length > 0 ? detalhes : undefined;
};

const extrairMensagem = (corpo: unknown, status: number): string => {
  if (typeof corpo === 'object' && corpo !== null) {
    const { error } = corpo as CorpoErroApi;
    if (typeof error === 'string' && error.trim() !== '') return error;
  }

  if (status >= 500) return 'O servidor encontrou um erro. Tente novamente mais tarde.';
  return 'Não foi possível concluir a operação.';
};

/** Lê o corpo como JSON sem lançar quando o conteúdo é vazio ou inválido. */
const lerCorpo = async (resposta: Response): Promise<unknown> => {
  const texto = await resposta.text();
  if (texto.trim() === '') return null;

  try {
    return JSON.parse(texto) as unknown;
  } catch {
    return texto;
  }
};

const criarErroDeRede = (causa: unknown): ApiError =>
  new ApiError({
    kind: 'network',
    message: 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.',
    cause: causa,
  });

/**
 * Executa uma requisição e devolve o corpo já tipado.
 * Lança `ApiError` em qualquer falha.
 */
export const request = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const { method = 'GET', body, token, signal } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  // Combina o sinal externo (TanStack Query) com o timeout interno.
  const abortExterno = () => controller.abort();
  signal?.addEventListener('abort', abortExterno);

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const resposta = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });

    const corpo = await lerCorpo(resposta);

    if (!resposta.ok) {
      // 401 em requisição autenticada significa sessão inválida/expirada.
      // O evento é publicado aqui para que a sessão seja encerrada de forma
      // centralizada, sem que cada tela precise tratar isso.
      if (resposta.status === 401 && token) {
        emitUnauthorized();
      }

      throw new ApiError({
        kind: 'http',
        status: resposta.status,
        message: extrairMensagem(corpo, resposta.status),
        detalhes: extrairDetalhes((corpo as CorpoErroApi | null)?.detalhes),
      });
    }

    return corpo as T;
  } catch (erro) {
    if (erro instanceof ApiError) throw erro;

    // Abortado pelo consumidor (ex.: troca de termo de busca) ou por timeout.
    if (erro instanceof Error && erro.name === 'AbortError') {
      if (signal?.aborted) {
        throw new ApiError({ kind: 'unknown', message: 'Requisição cancelada.', cause: erro });
      }
      throw new ApiError({
        kind: 'network',
        message: 'O servidor demorou para responder. Tente novamente.',
        cause: erro,
      });
    }

    throw criarErroDeRede(erro);
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener('abort', abortExterno);
  }
};
