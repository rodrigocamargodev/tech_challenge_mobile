/**
 * Tipos do domínio de postagens.
 *
 * Espelham exatamente o contrato documentado em `docs/api-contracts.md`
 * (seção 3 — Posts), derivado do código real do backend.
 */

/**
 * Postagem como o backend a expõe.
 *
 * `autor` é o nome do professor autenticado no momento da criação e é
 * derivado do token — o app **nunca** envia esse campo.
 */
export interface Post {
  _id: string;
  titulo: string;
  conteudo: string;
  autor: string;
  autorId?: string;
  criadoEm: string;
  atualizadoEm: string;
}

/**
 * Corpo aceito por `POST /posts` e `PUT /posts/:id`.
 *
 * Apenas `titulo` e `conteudo` são enviados: `autor`/`autorId` são ignorados
 * pelo backend e não devem ser enviados pelo cliente.
 */
export interface DadosPost {
  titulo: string;
  conteudo: string;
}

/** Resposta de `DELETE /posts/:id`. */
export interface RespostaExclusaoPost {
  message: string;
}
