import { useEffect, useState } from 'react';

/**
 * Devolve o valor após `delay` ms sem alterações.
 *
 * Usado na busca de postagens para não disparar uma requisição por tecla
 * digitada. O valor inicial é devolvido imediatamente.
 */
export function useDebounce<T>(valor: T, delay = 400): T {
  const [valorDebounced, setValorDebounced] = useState(valor);

  useEffect(() => {
    const id = setTimeout(() => setValorDebounced(valor), delay);
    return () => clearTimeout(id);
  }, [valor, delay]);

  return valorDebounced;
}
