import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/core/theme/tokens';
import { Button } from '@/shared/components/Button';
import { OptionGroup } from '@/shared/components/OptionGroup';
import { TextField } from '@/shared/components/TextField';

import {
  papeis,
  rotuloPapel,
  usuarioSchema,
  type ModoFormularioUsuario,
  type UsuarioFormValues,
} from '../schemas';
import type { Papel } from '../types';

export interface UserFormProps {
  modo: ModoFormularioUsuario;
  /** Valores iniciais (edição). Vazio na criação. */
  valoresIniciais?: Partial<UsuarioFormValues>;
  /** Papel selecionado (controlado pela tela). */
  papel: Papel;
  onPapelChange: (papel: Papel) => void;
  /**
   * Impede alterar o papel. Usado quando o próprio professor edita a sua conta:
   * o backend responde `403` nesse caso, então o campo é travado na interface.
   */
  papelBloqueado?: boolean;
  submitLabel: string;
  onSubmit: (valores: UsuarioFormValues) => void;
  /** Erros de validação devolvidos pelo backend (422/409), por campo. */
  errosServidor?: Record<string, string>;
  enviando?: boolean;
}

/**
 * Formulário de criação/edição de usuário.
 *
 * Diferente do formulário de postagem, o papel não é um campo de texto livre:
 * é um `OptionGroup` restrito aos dois valores aceitos pelo backend
 * (`professor` | `aluno`), evitando que o app envie valores inválidos.
 *
 * A senha nunca é preenchida com o valor atual (a API não a devolve). Na
 * edição, deixar o campo vazio mantém a senha existente.
 */
export function UserForm({
  modo,
  valoresIniciais,
  papel,
  onPapelChange,
  papelBloqueado = false,
  submitLabel,
  onSubmit,
  errosServidor,
  enviando = false,
}: UserFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<UsuarioFormValues>({
    resolver: zodResolver(usuarioSchema(modo)),
    defaultValues: {
      nome: valoresIniciais?.nome ?? '',
      email: valoresIniciais?.email ?? '',
      senha: '',
    },
  });

  const editando = modo === 'edicao';

  return (
    <View style={styles.form}>
      <Controller
        control={control}
        name="nome"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="Nome completo"
            testID="usuario-nome"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.nome?.message ?? errosServidor?.nome}
            hint="De 2 a 120 caracteres."
            placeholder="Ex.: Maria Silva"
            editable={!enviando}
            maxLength={120}
            autoCapitalize="words"
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
            testID="usuario-email"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.email?.message ?? errosServidor?.email}
            placeholder="voce@escola.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            editable={!enviando}
            returnKeyType="next"
          />
        )}
      />

      <Controller
        control={control}
        name="senha"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label={editando ? 'Nova senha (opcional)' : 'Senha'}
            testID="usuario-senha"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.senha?.message ?? errosServidor?.senha}
            hint={
              editando
                ? 'Deixe em branco para manter a senha atual.'
                : 'De 8 a 72 caracteres. Informe esta senha ao usuário.'
            }
            placeholder={editando ? 'Manter senha atual' : 'Mínimo de 8 caracteres'}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
            editable={!enviando}
            maxLength={72}
            returnKeyType="done"
          />
        )}
      />

      <OptionGroup
        label="Papel"
        testID="usuario-papel"
        options={papeis.map((valor) => ({ value: valor, label: rotuloPapel(valor) }))}
        value={papel}
        onChange={onPapelChange}
        disabled={enviando || papelBloqueado}
        hint={
          papelBloqueado
            ? 'Você não pode alterar o seu próprio papel.'
            : 'Professores administram postagens e usuários; alunos apenas leem.'
        }
      />

      {errosServidor?.role ? <Text style={styles.erroCampo}>{errosServidor.role}</Text> : null}

      <Button
        label={submitLabel}
        testID="usuario-submit"
        onPress={handleSubmit((valores) => onSubmit(valores))}
        loading={enviando}
        disabled={enviando}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.lg,
  },
  erroCampo: {
    ...typography.caption,
    color: colors.ink,
    fontWeight: '600',
  },
});
