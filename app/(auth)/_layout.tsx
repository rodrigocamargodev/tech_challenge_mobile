import { Stack } from 'expo-router';

/**
 * Rota inicial do grupo público.
 *
 * Sem âncora explícita, o Expo Router escolheria a primeira rota em ordem
 * alfabética (`cadastro`), o que abriria o app no cadastro em vez do login.
 */
export const unstable_settings = { anchor: 'login' };

/**
 * Layout do grupo público.
 *
 * As telas de login e cadastro não exibem cabeçalho: cada uma tem o próprio
 * cabeçalho institucional.
 */
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
