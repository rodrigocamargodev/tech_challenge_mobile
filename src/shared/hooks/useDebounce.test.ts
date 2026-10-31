import { renderHook, waitFor } from '@testing-library/react-native';

import { useDebounce } from './useDebounce';

describe('useDebounce', () => {
  it('devolve o valor inicial imediatamente', async () => {
    const { result } = await renderHook(() => useDebounce('a', 50));

    expect(result.current).toBe('a');
  });

  it('só atualiza após o intervalo configurado', async () => {
    const { result, rerender } = await renderHook(
      ({ valor }: { valor: string }) => useDebounce(valor, 50),
      { initialProps: { valor: 'a' } }
    );

    await rerender({ valor: 'ab' });
    expect(result.current).toBe('a');

    await waitFor(() => expect(result.current).toBe('ab'));
  });

  it('reinicia o temporizador a cada alteração', async () => {
    const { result, rerender } = await renderHook(
      ({ valor }: { valor: string }) => useDebounce(valor, 80),
      { initialProps: { valor: 'a' } }
    );

    await rerender({ valor: 'ab' });
    await rerender({ valor: 'abc' });

    // O valor intermediário nunca é publicado.
    expect(result.current).toBe('a');

    await waitFor(() => expect(result.current).toBe('abc'));
  });
});
