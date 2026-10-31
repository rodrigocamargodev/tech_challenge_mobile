import { createQueryClient } from './queryClient';
import { ApiError } from './ApiError';

describe('createQueryClient', () => {
  it('cria um QueryClient com as políticas padrão', () => {
    const client = createQueryClient();
    const opcoes = client.getDefaultOptions();

    expect(opcoes.queries?.staleTime).toBe(30_000);
    expect(opcoes.queries?.refetchOnWindowFocus).toBe(false);
    expect(opcoes.mutations?.retry).toBe(false);
  });

  it('não repete erros de negócio (4xx)', () => {
    const client = createQueryClient();
    const retry = client.getDefaultOptions().queries?.retry;

    expect(typeof retry).toBe('function');
    const decidir = retry as (falhas: number, erro: unknown) => boolean;

    expect(decidir(0, new ApiError({ kind: 'http', status: 401, message: 'x' }))).toBe(false);
    expect(decidir(0, new ApiError({ kind: 'http', status: 422, message: 'x' }))).toBe(false);
  });

  it('repete falhas de rede e erros 5xx até duas vezes', () => {
    const client = createQueryClient();
    const decidir = client.getDefaultOptions().queries?.retry as (
      falhas: number,
      erro: unknown
    ) => boolean;

    const rede = new ApiError({ kind: 'network', message: 'x' });
    const servidor = new ApiError({ kind: 'http', status: 500, message: 'x' });

    expect(decidir(0, rede)).toBe(true);
    expect(decidir(1, rede)).toBe(true);
    expect(decidir(2, rede)).toBe(false);

    expect(decidir(0, servidor)).toBe(true);
    expect(decidir(2, servidor)).toBe(false);
  });

  it('repete erro desconhecido no máximo uma vez', () => {
    const client = createQueryClient();
    const decidir = client.getDefaultOptions().queries?.retry as (
      falhas: number,
      erro: unknown
    ) => boolean;

    expect(decidir(0, new Error('inesperado'))).toBe(true);
    expect(decidir(1, new Error('inesperado'))).toBe(false);
  });
});
