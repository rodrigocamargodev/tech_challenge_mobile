import { ApiError } from '@/core/http/ApiError';

/**
 * Tradução de erros de autenticação para mensagens de interface.
 *
 * Centraliza a distinção entre:
 * - `401` — credenciais inválidas (login) ou sessão expirada;
 * - `403` — conta desativada / permissão insuficiente;
 * - `409` — e-mail já cadastrado;
 * - `422` — validação do backend (com `detalhes` por campo);
 * - `429` — limite de tentativas de login excedido.
 */

export interface ErroFormulario {
  /** Mensagem geral exibida no topo do formulário. */
  mensagem: string;
  /** Erros por campo, quando o backend devolve `detalhes` (422). */
  campos: Record<string, string>;
}

const MENSAGEM_PADRAO = 'Não foi possível concluir a operação. Tente novamente.';

/** Converte `detalhes` do backend em um mapa campo → mensagem. */
const mapearCampos = (erro: ApiError): Record<string, string> => {
  const campos: Record<string, string> = {};

  for (const detalhe of erro.detalhes ?? []) {
    // Mantém a primeira mensagem de cada campo.
    if (!(detalhe.campo in campos)) {
      campos[detalhe.campo] = detalhe.mensagem;
    }
  }

  return campos;
};

/**
 * @param contexto `login` ou `cadastro`, para escolher mensagens adequadas.
 */
export const traduzirErroAuth = (
  erro: unknown,
  contexto: 'login' | 'cadastro'
): ErroFormulario => {
  if (!(erro instanceof ApiError)) {
    return { mensagem: MENSAGEM_PADRAO, campos: {} };
  }

  if (erro.isRateLimited) {
    return {
      mensagem:
        'Muitas tentativas de login. Aguarde alguns minutos antes de tentar novamente.',
      campos: {},
    };
  }

  if (erro.isUnauthorized) {
    return {
      mensagem:
        contexto === 'login'
          ? 'E-mail ou senha inválidos.'
          : 'Não foi possível entrar com a conta recém-criada. Faça login.',
      campos: {},
    };
  }

  if (erro.isForbidden) {
    return {
      mensagem: 'Sua conta está desativada. Procure um professor responsável.',
      campos: {},
    };
  }

  if (erro.isConflict) {
    return {
      mensagem: 'Já existe uma conta cadastrada com este e-mail.',
      campos: { email: 'Este e-mail já está em uso.' },
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
      mensagem: 'Não foi possível conectar ao servidor. Verifique sua conexão.',
      campos: {},
    };
  }

  return { mensagem: erro.message || MENSAGEM_PADRAO, campos: {} };
};
