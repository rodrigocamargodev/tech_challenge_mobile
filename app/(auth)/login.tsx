import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text } from 'react-native';

import { colors, spacing, typography } from '@/core/theme/tokens';
import { Banner } from '@/shared/components/Banner';
import { Button } from '@/shared/components/Button';
import { TextField } from '@/shared/components/TextField';

import { useAuth } from '@/features/auth/AuthContext';
import { AuthScreen } from '@/features/auth/components/AuthScreen';
import { traduzirErroAuth, type ErroFormulario } from '@/features/auth/authErrors';
import { loginSchema, type LoginFormData } from '@/features/auth/schemas';

/**
 * Tela de login.
 *
 * Não navega manualmente após o sucesso: a mudança de estado do `AuthProvider`
 * libera o grupo de rotas autenticadas e o Expo Router redireciona sozinho.
 * Isso evita redirecionamentos duplicados e loops.
 */
export default function LoginScreen() {
  const { login, restoreError } = useAuth();
  const [erro, setErro] = useState<ErroFormulario | null>(null);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', senha: '' },
  });

  const onSubmit = handleSubmit(async (dados) => {
    setErro(null);

    try {
      await login(dados);
    } catch (falha) {
      const traduzido = traduzirErroAuth(falha, 'login');
      setErro(traduzido);

      // Erros de validação do backend são associados aos campos.
      for (const [campo, mensagem] of Object.entries(traduzido.campos)) {
        if (campo === 'email' || campo === 'senha') {
          setError(campo, { type: 'server', message: mensagem });
        }
      }
    }
  });

  const mensagemGeral = erro?.mensagem ?? restoreError;

  return (
    <AuthScreen
      title="Entrar"
      subtitle="Acesse com sua conta para consultar as postagens."
      footer={
        <Link href="/cadastro" style={styles.link} accessibilityRole="link">
          Ainda não tem conta? Cadastre-se
        </Link>
      }
    >
      {mensagemGeral ? <Banner message={mensagemGeral} variant="error" testID="login-erro" /> : null}

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="E-mail"
            testID="login-email"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.email?.message}
            placeholder="voce@escola.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="next"
          />
        )}
      />

      <Controller
        control={control}
        name="senha"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="Senha"
            testID="login-senha"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.senha?.message}
            placeholder="Sua senha"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="current-password"
            textContentType="password"
            returnKeyType="done"
            onSubmitEditing={() => {
              void onSubmit();
            }}
          />
        )}
      />

      <Button
        label="Entrar"
        testID="login-submit"
        onPress={onSubmit}
        loading={isSubmitting}
        accessibilityHint="Valida suas credenciais e abre o aplicativo"
      />

      <Text style={styles.aviso}>
        Alunos e professores usam a mesma tela de login. O acesso às áreas administrativas
        depende do seu papel.
      </Text>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  link: {
    ...typography.bodyStrong,
    color: colors.chalkYellow,
    paddingVertical: spacing.sm,
  },
  aviso: {
    ...typography.caption,
    color: colors.mutedInk,
  },
});
