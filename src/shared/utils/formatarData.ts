/**
 * Formatação de datas ISO 8601 para exibição.
 *
 * Usa `Intl.DateTimeFormat` com locale `pt-BR`. Em ambientes sem ICU completo
 * (alguns builds Android antigos), cai para um formato manual previsível.
 */

const formatador = (() => {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return null;
  }
})();

/** Converte uma data ISO em texto legível. Datas inválidas devolvem `''`. */
export const formatarData = (iso: string): string => {
  const data = new Date(iso);

  if (Number.isNaN(data.getTime())) return '';

  if (formatador) {
    return formatador.format(data);
  }

  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  return `${dia}/${mes}/${data.getFullYear()}`;
};

/** Resumo do conteúdo para os cards, sem cortar palavras no meio. */
export const resumirTexto = (texto: string, limite = 160): string => {
  const limpo = texto.replace(/\s+/g, ' ').trim();

  if (limpo.length <= limite) return limpo;

  const corte = limpo.slice(0, limite);
  const ultimoEspaco = corte.lastIndexOf(' ');

  return `${(ultimoEspaco > 0 ? corte.slice(0, ultimoEspaco) : corte).trimEnd()}…`;
};
