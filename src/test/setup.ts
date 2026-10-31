// Importar a biblioteca registra automaticamente os matchers do Jest
// (`toBeOnTheScreen`, `toHaveTextContent`, etc.).
import '@testing-library/react-native';

/**
 * Configuração global dos testes.
 *
 * Mocks apenas de módulos nativos que não existem no ambiente Jest.
 * Nenhum mock de regra de negócio é declarado aqui.
 */

// Expo SecureStore usa Keychain/Keystore nativos: substituído por memória.
jest.mock('expo-secure-store', () => {
  const store = new Map<string, string>();

  return {
    getItemAsync: jest.fn(async (chave: string) => store.get(chave) ?? null),
    setItemAsync: jest.fn(async (chave: string, valor: string) => {
      store.set(chave, valor);
    }),
    deleteItemAsync: jest.fn(async (chave: string) => {
      store.delete(chave);
    }),
    __reset: () => store.clear(),
  };
});

// SafeAreaProvider depende de medidas nativas.
jest.mock('react-native-safe-area-context', () => {
  // `jest.requireActual` é necessário porque as fábricas de `jest.mock` são
  // hoisted e não podem referenciar imports do módulo.
  const React = jest.requireActual<typeof import('react')>('react');
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');

  const inset = { top: 0, right: 0, bottom: 0, left: 0 };

  return {
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) =>
      React.createElement(View, null, children),
    SafeAreaView: ({ children, ...props }: { children: React.ReactNode }) =>
      React.createElement(View, props, children),
    useSafeAreaInsets: () => inset,
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 }),
    initialWindowMetrics: { insets: inset, frame: { x: 0, y: 0, width: 390, height: 844 } },
  };
});
