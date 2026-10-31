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
import { cadastroSchema, type CadastroFormData } from '@/features/auth/schemas';

/**
 * Tela de cadastro público.
 *
 * Cria **sempre** um aluno: o backend ignora `role` em `POST /auth/register`,
 * e o app nem envia esse campo.
 *
 * Após o cadastro, o `AuthProvider` tenta abrir a sessão automaticamente. Se
 * isso não for possível, o usuário é orientado a entrar manualmente.
 */
export default function CadastroScreen() {
  const { cadastrar } = useAuth();
  const [erro, setErro] = useState<ErroFormulario | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CadastroFormData>({
    resolver: zodResolver(cadastroSchema),
    defaultValues: { nome: '', email: '', senha: '' },
  });

  const onSubmit = handleSubmit(async (dados) => {
    setErro(null);
    setAviso(null);

    try {
      const resultado = await cadastrar(dados);

      if (!resultado.sessaoIniciada) {
        setAviso('Conta criada com sucesso. Entre com seu e-mail e senha para continuar.');
      }
      // Em caso de sucesso com sessão, o grupo autenticado é liberado pelo
      // Expo Router automaticamente.
    } catch (falha) {
      const traduzido = traduzirErroAuth(falha, 'cadastro');
      setErro(traduzido);

      for (const [campo, mensagem] of Object.entries(traduzido.campos)) {
        if (campo === 'nome' || campo === 'email' || campo === 'senha') {
          setError(campo, { type: 'server', message: mensagem });
        }
      }
    }
  });

  return (
    <AuthScreen
      title="Criar conta de aluno"
      subtitle="O cadastro público cria uma conta de aluno. Contas de professor são criadas por um professor responsável."
      footer={
        <Link href="/login" style={styles.link} accessibilityRole="link">
          Já tem conta? Entrar
        </Link>
      }
    >
      {erro?.mensagem ? (
        <Banner message={erro.mensagem} variant="error" testID="cadastro-erro" />
      ) : null}

      {aviso ? <Banner message={aviso} variant="success" testID="cadastro-aviso" /> : null}

      <Controller
        control={control}
        name="nome"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="Nome completo"
            testID="cadastro-nome"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.nome?.message}
            placeholder="Maria Silva"
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
            returnKeyType="next"
          />
        )}
      />

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="E-mail"
            testID="cadastro-email"
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
            testID="cadastro-senha"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.senha?.message}
            hint="Entre 8 e 72 caracteres."
            placeholder="Crie uma senha"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="done"
            onSubmitEditing={() => {
              void onSubmit();
            }}
          />
        )}
      />

      <Button
        label="Criar conta"
        testID="cadastro-submit"
        onPress={onSubmit}
        loading={isSubmitting}
        accessibilityHint="Cria sua conta de aluno e entra no aplicativo"
      />

      <Text style={styles.aviso}>
        Sua senha é enviada apenas ao servidor e nunca é armazenada no aparelho.
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
