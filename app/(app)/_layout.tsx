import { Stack } from 'expo-router';

/** Rota inicial do grupo autenticado. */
export const unstable_settings = { anchor: 'index' };

/**
 * Layout do grupo autenticado.
 *
 * Só é montado quando há sessão válida (ver `app/_layout.tsx`).
 * Telas administrativas das próximas fases devem ser envolvidas por
 * `RoleGuard area="professor"` ou por `Stack.Protected guard={isProfessor}`.
 */
export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}
