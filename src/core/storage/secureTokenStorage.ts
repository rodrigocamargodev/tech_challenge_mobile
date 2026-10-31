import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { TOKEN_STORAGE_KEY } from '../config/env';

/**
 * Armazenamento do token JWT.
 *
 * Em iOS/Android usa Expo SecureStore (Keychain / Keystore).
 * Nunca usa AsyncStorage e nunca persiste senha.
 *
 * Web: `expo-secure-store` não implementa armazenamento seguro no navegador
 * (o módulo web é um objeto vazio). Como o alvo do projeto é mobile e o
 * navegador é usado apenas para pré-visualização em desenvolvimento, o token
 * fica em `sessionStorage` — limpo ao fechar a aba e não compartilhado entre
 * abas. Isso NÃO é usado em produção mobile.
 */

const ehWeb = Platform.OS === 'web';

/** Acesso defensivo ao sessionStorage (pode estar indisponível). */
const sessionStorageSeguro = (): Storage | null => {
  try {
    return typeof globalThis.sessionStorage === 'undefined' ? null : globalThis.sessionStorage;
  } catch {
    return null;
  }
};

/** Lê o token salvo. Devolve `null` quando não há sessão. */
export const getToken = async (): Promise<string | null> => {
  if (ehWeb) {
    return sessionStorageSeguro()?.getItem(TOKEN_STORAGE_KEY) ?? null;
  }

  try {
    return await SecureStore.getItemAsync(TOKEN_STORAGE_KEY);
  } catch {
    // Falha de leitura não deve derrubar o app: trata como "sem sessão".
    return null;
  }
};

/** Salva o token de forma segura. */
export const saveToken = async (token: string): Promise<void> => {
  if (ehWeb) {
    sessionStorageSeguro()?.setItem(TOKEN_STORAGE_KEY, token);
    return;
  }

  await SecureStore.setItemAsync(TOKEN_STORAGE_KEY, token);
};

/** Remove o token (logout ou sessão inválida). */
export const clearToken = async (): Promise<void> => {
  if (ehWeb) {
    sessionStorageSeguro()?.removeItem(TOKEN_STORAGE_KEY);
    return;
  }

  try {
    await SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY);
  } catch {
    // Se a remoção falhar, não há ação útil a tomar aqui.
  }
};
