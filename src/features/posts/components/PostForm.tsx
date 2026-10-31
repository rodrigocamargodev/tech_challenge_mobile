import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/core/theme/tokens';
import { Button } from '@/shared/components/Button';
import { TextField } from '@/shared/components/TextField';

import { postSchema, type PostFormData } from '../schemas';

export interface PostFormProps {
  /** Valores iniciais (edição). Vazio na criação. */
  valoresIniciais?: PostFormData;
  /** Rótulo do botão de envio. */
  submitLabel: string;
  /** Chamado com os dados já validados pelo Zod. */
  onSubmit: (dados: PostFormData) => void;
  /** Erros de validação devolvidos pelo backend (422), por campo. */
  errosServidor?: Record<string, string>;
  /** Erro geral exibido acima do formulário. */
  erroGeral?: string | null;
  /** Indica envio em andamento. */
  enviando?: boolean;
  /** Desabilita o formulário (ex.: durante o envio). */
  desabilitado?: boolean;
}

/**
 * Formulário de criação/edição de postagem.
 *
 * Validação local com React Hook Form + Zod, espelhando as regras do backend.
 * Erros `422` do servidor são associados aos campos correspondentes.
 *
 * O campo `autor` não existe aqui de propósito: o backend o deriva do token.
 */
export function PostForm({
  valoresIniciais,
  submitLabel,
  onSubmit,
  errosServidor,
  erroGeral,
  enviando = false,
  desabilitado = false,
}: PostFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      titulo: valoresIniciais?.titulo ?? '',
      conteudo: valoresIniciais?.conteudo ?? '',
    },
  });

  const bloqueado = enviando || desabilitado;

  return (
    <View style={styles.form}>
      <Controller
        control={control}
        name="titulo"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="Título"
            testID="post-titulo"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.titulo?.message ?? errosServidor?.titulo}
            hint="Até 200 caracteres."
            placeholder="Ex.: Introdução ao Node.js"
            editable={!bloqueado}
            maxLength={200}
            returnKeyType="next"
          />
        )}
      />

      <Controller
        control={control}
        name="conteudo"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="Conteúdo"
            testID="post-conteudo"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.conteudo?.message ?? errosServidor?.conteudo}
            hint="Até 20000 caracteres."
            placeholder="Escreva o conteúdo da aula…"
            editable={!bloqueado}
            multiline
            numberOfLines={8}
            maxLength={20000}
            inputStyle={styles.textarea}
            textAlignVertical="top"
          />
        )}
      />

      <Button
        label={submitLabel}
        testID="post-submit"
        onPress={handleSubmit((dados) => onSubmit(dados))}
        loading={enviando}
        disabled={bloqueado}
        accessibilityHint={erroGeral ?? undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.lg,
  },
  textarea: {
    minHeight: 160,
    paddingTop: spacing.md,
  },
});
