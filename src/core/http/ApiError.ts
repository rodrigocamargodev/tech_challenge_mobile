/**
 * Erro normalizado da API.
 *
 * Centraliza o tratamento de falhas para que a interface nunca precise
 * interpretar `Response` ou `fetch` diretamente.
 */

export type ApiErrorKind =
  /** Falha de rede, DNS, timeout ou servidor inacessível. */
  | 'network'
  /** Resposta HTTP com status de erro. */
  | 'http'
  /** Corpo da resposta não é o JSON esperado. */
  | 'parse'
  /** Erro inesperado no cliente. */
  | 'unknown';

export interface ApiErrorDetalhe {
  campo: string;
  mensagem: string;
}

export interface ApiErrorOptions {
  kind: ApiErrorKind;
  message: string;
  status?: number;
  detalhes?: ApiErrorDetalhe[];
  cause?: unknown;
}

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;
  readonly detalhes?: ApiErrorDetalhe[];

  constructor({ kind, message, status, detalhes, cause }: ApiErrorOptions) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
    this.detalhes = detalhes;
    if (cause !== undefined) {
      this.cause = cause;
    }
  }

  /** `true` quando o problema é de conectividade, não de regra de negócio. */
  get isNetworkError(): boolean {
    return this.kind === 'network';
  }

  /** `true` quando a sessão não é mais válida (token ausente/expirado). */
  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  /** `true` quando o usuário autenticado não tem permissão. */
  get isForbidden(): boolean {
    return this.status === 403;
  }

  /** `true` quando o recurso não existe. */
  get isNotFound(): boolean {
    return this.status === 404;
  }

  /** `true` quando há conflito de unicidade (ex.: e-mail já cadastrado). */
  get isConflict(): boolean {
    return this.status === 409;
  }

  /** `true` quando a entrada falhou na validação do backend (422). */
  get isValidationError(): boolean {
    return this.status === 422;
  }

  /** `true` quando o limite de tentativas foi excedido (429). */
  get isRateLimited(): boolean {
    return this.status === 429;
  }
}

/** Converte qualquer valor lançado em uma mensagem exibível ao usuário. */
export const mensagemDeErro = (erro: unknown): string => {
  if (erro instanceof ApiError) return erro.message;
  if (erro instanceof Error && erro.message) return erro.message;
  return 'Ocorreu um erro inesperado. Tente novamente.';
};
