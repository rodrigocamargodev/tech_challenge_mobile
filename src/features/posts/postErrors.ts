import { ApiError } from '@/core/http/ApiError';

/**
 * Tradução de erros de postagens para mensagens de interface.
 *
 * Centraliza o tratamento dos status documentados no contrato:
 * - `400` — identificador inválido / requisição malformada;
 * - `401` — sessão expirada (o `AuthProvider` já encerra a sessão);
 * - `403` — papel insuficiente (aluno tentando operação de professor);
 * - `404` — postagem não encontrada;
 * - `422` — validação, com `detalhes` por campo.
 */

export type ContextoErroPost = 'lista' | 'detalhe' | 'salvar' | 'excluir';

export interface ErroPost {
  /** Mensagem geral exibida no topo da tela/formulário. */
  mensagem: string;
  /** Erros por campo, quando o backend devolve `detalhes` (422). */
  campos: Record<string, string>;
}

const MENSAGEM_PADRAO = 'Não foi possível concluir a operação. Tente novamente.';

/** Converte `detalhes` do backend em um mapa campo → mensagem. */
const mapearCampos = (erro: ApiError): Record<string, string> => {
  const campos: Record<string, string> = {};

  for (const detalhe of erro.detalhes ?? []) {
    if (!(detalhe.campo in campos)) {
      campos[detalhe.campo] = detalhe.mensagem;
    }
  }

  return campos;
};

export const traduzirErroPost = (erro: unknown, contexto: ContextoErroPost): ErroPost => {
  if (!(erro instanceof ApiError)) {
    return { mensagem: MENSAGEM_PADRAO, campos: {} };
  }

  if (erro.isUnauthorized) {
    return {
      mensagem: 'Sua sessão expirou. Entre novamente para continuar.',
      campos: {},
    };
  }

  if (erro.isForbidden) {
    return {
      mensagem: 'Você não tem permissão para realizar esta ação.',
      campos: {},
    };
  }

  if (erro.isNotFound) {
    return {
      mensagem:
        contexto === 'detalhe'
          ? 'Esta postagem não existe mais ou foi removida.'
          : 'A postagem não foi encontrada. Ela pode ter sido removida por outro professor.',
      campos: {},
    };
  }

  if (erro.isValidationError) {
    return {
      mensagem: erro.message || 'Verifique os dados informados.',
      campos: mapearCampos(erro),
    };
  }

  if (erro.isNetworkError) {
    return {
      mensagem: 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.',
      campos: {},
    };
  }

  if (erro.status === 400) {
    return {
      mensagem: erro.message || 'Requisição inválida. Verifique os dados e tente novamente.',
      campos: {},
    };
  }

  return { mensagem: erro.message || MENSAGEM_PADRAO, campos: {} };
};
