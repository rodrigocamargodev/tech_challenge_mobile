import { ApiError } from '@/core/http/ApiError';

/**
 * Tradução de erros de usuários para mensagens de interface.
 *
 * Centraliza os status documentados no contrato (seção 4/5):
 * - `400` — identificador inválido;
 * - `401` — sessão expirada (o `AuthProvider` já encerra a sessão);
 * - `403` — papel insuficiente **ou** regra de negócio (alterar o próprio
 *   papel / desativar a própria conta);
 * - `404` — usuário não encontrado;
 * - `409` — e-mail já cadastrado;
 * - `422` — validação, com `detalhes` por campo.
 *
 * O `403` é o caso mais delicado: o backend usa o mesmo status para "não é
 * professor" e para "você não pode desativar a si mesmo". Como a mensagem do
 * backend é específica e segura (não expõe detalhes internos), ela é
 * reaproveitada.
 */

export type ContextoErroUsuario =
  | 'lista'
  | 'detalhe'
  | 'criar'
  | 'editar'
  | 'desativar'
  | 'reativar';

export interface ErroUsuario {
  /** Mensagem geral exibida no topo da tela/formulário. */
  mensagem: string;
  /** Erros por campo, quando o backend devolve `detalhes` (422). */
  campos: Record<string, string>;
}

const MENSAGEM_PADRAO = 'Não foi possível concluir a operação. Tente novamente.';

const MENSAGEM_SEM_PERMISSAO = 'Você não tem permissão para gerenciar usuários.';

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

/**
 * Distingue "sem permissão" de "regra de negócio" dentro do `403`.
 *
 * O backend responde, por exemplo:
 * - `Acesso negado. Permissão insuficiente.` (aluno chamando rota de professor)
 * - `Você não pode desativar o seu próprio usuário.`
 * - `Você não pode alterar o seu próprio papel.`
 *
 * Quando a mensagem descreve uma regra de negócio conhecida, ela é exibida;
 * caso contrário, usa-se a mensagem genérica de permissão.
 */
const ehRegraDeNegocio = (mensagem: string): boolean =>
  /próprio|proprio/i.test(mensagem);

export const traduzirErroUsuario = (
  erro: unknown,
  contexto: ContextoErroUsuario
): ErroUsuario => {
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
      mensagem: ehRegraDeNegocio(erro.message)
        ? erro.message
        : MENSAGEM_SEM_PERMISSAO,
      campos: {},
    };
  }

  if (erro.isNotFound) {
    return {
      mensagem:
        contexto === 'detalhe'
          ? 'Este usuário não existe mais.'
          : 'O usuário não foi encontrado. Ele pode ter sido alterado por outro professor.',
      campos: {},
    };
  }

  if (erro.isConflict) {
    return {
      mensagem: 'Já existe um usuário cadastrado com este e-mail.',
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
