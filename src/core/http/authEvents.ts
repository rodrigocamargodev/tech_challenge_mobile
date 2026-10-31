/**
 * Canal de eventos de autenticação.
 *
 * O cliente HTTP não conhece o contexto de autenticação (e não deve conhecer).
 * Quando uma requisição autenticada recebe `401`, o cliente publica um evento
 * aqui e o `AuthProvider` — único assinante — encerra a sessão de forma
 * centralizada.
 *
 * Regra importante: o evento só é publicado quando a requisição enviou um
 * token. Assim, um `401` de credenciais inválidas em `POST /auth/login`
 * (que é uma requisição anônima) nunca derruba a sessão de outro usuário.
 */

type Ouvinte = () => void;

const ouvintes = new Set<Ouvinte>();

/**
 * Registra um ouvinte. Devolve a função de cancelamento do registro.
 */
export const subscribeToUnauthorized = (ouvinte: Ouvinte): (() => void) => {
  ouvintes.add(ouvinte);
  return () => {
    ouvintes.delete(ouvinte);
  };
};

/** Notifica todos os ouvintes de que a sessão não é mais válida. */
export const emitUnauthorized = (): void => {
  // Cópia defensiva: um ouvinte pode cancelar o próprio registro ao reagir.
  for (const ouvinte of [...ouvintes]) {
    ouvinte();
  }
};

/** Remove todos os ouvintes. Usado apenas em testes para isolar cenários. */
export const resetUnauthorizedListeners = (): void => {
  ouvintes.clear();
};
