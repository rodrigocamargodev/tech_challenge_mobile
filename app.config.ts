import type { ExpoConfig } from 'expo/config';

/**
 * Configuração do Expo — Blog de Giz.
 *
 * Identidade visual "Lousa Moderna": fundo verde-lousa (#1A2E26) com a marca
 * em giz amarelo (#F4D068) e a linha escrita em branco-giz (#F7F9F6).
 *
 * A URL da API NÃO é definida aqui: ela é lida em tempo de execução por
 * `src/core/config/env.ts` a partir de `EXPO_PUBLIC_API_URL`. Nenhum segredo
 * ou credencial é declarado neste arquivo.
 *
 * Permissões: o aplicativo não declara permissões adicionais. Apenas a
 * permissão de internet (implícita no Expo) é necessária para falar com a API.
 */
const CHALKBOARD = '#1A2E26';

const config: ExpoConfig = {
  name: 'Blog de Giz',
  slug: 'blog-de-giz',
  version: '1.0.0',
  orientation: 'portrait',
  scheme: 'blogdegiz',
  userInterfaceStyle: 'light',

  icon: './assets/icon.png',

  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.blogdegiz.mobile',
  },

  android: {
    package: 'com.blogdegiz.mobile',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: CHALKBOARD,
    },
    /**
     * O aplicativo só precisa de acesso à internet para falar com a API.
     * As permissões abaixo são adicionadas por padrão pelo Expo/React Native e
     * não são usadas por nenhuma funcionalidade do Blog de Giz.
     */
    blockedPermissions: [
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      'android.permission.SYSTEM_ALERT_WINDOW',
      'android.permission.VIBRATE',
    ],
  },

  web: {
    bundler: 'metro',
    favicon: './assets/favicon.png',
  },

  plugins: [
    'expo-router',
    'expo-secure-store',
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: CHALKBOARD,
      },
    ],
  ],
};

export default config;
