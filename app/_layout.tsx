import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { createQueryClient } from '@/core/http/queryClient';
import { colors } from '@/core/theme/tokens';
import { AuthProvider, useAuth } from '@/features/auth/AuthContext';
import { LoadingState } from '@/shared/components/LoadingState';

/**
 * Layout raiz.
 *
 * Providers globais + guarda de navegação por estado de sessão.
 *
 * Enquanto a sessão é restaurada, nenhum grupo de rotas é montado: apenas o
 * estado de carregamento é exibido. Isso evita "piscar" a tela de login para
 * quem já tem sessão e impede que conteúdo privado apareça antes da validação.
 */
export default function RootLayout() {
  // Criado uma única vez por instância do app.
  const [queryClient] = useState(createQueryClient);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <StatusBar style="light" />
          <RootNavigator />
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

function RootNavigator() {
  const { status } = useAuth();

  if (status === 'restoring') {
    return <LoadingState message="Verificando sua sessão…" testID="sessao-carregando" />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.chalkboard },
        headerTintColor: colors.chalkWhite,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: colors.paper },
      }}
    >
      {/*
        `redirectTo` é obrigatório e deve apontar para uma tela concreta do
        grupo oposto.
        - Sem `redirectTo`, o Expo Router usa a âncora do navegador, que é o
          caminho do grupo (`/(auth)` / `/(app)`) — inexistente como rota real,
          resultando em "Unmatched Route".
        - Se o destino apontar para o próprio grupo protegido, o router entra em
          loop de redirecionamento.
      */}
      <Stack.Protected guard={status === 'authenticated'} redirectTo="/login">
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
      </Stack.Protected>

      <Stack.Protected guard={status !== 'authenticated'} redirectTo="/">
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}
