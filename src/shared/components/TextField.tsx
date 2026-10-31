import { forwardRef, useState, type ComponentRef } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
} from 'react-native';

import { colors, minTouchTarget, radius, spacing, typography } from '@/core/theme/tokens';

export interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  /** Mensagem de erro associada ao campo. */
  error?: string;
  /** Texto auxiliar exibido quando não há erro. */
  hint?: string;
  /** Estilo adicional do input (ex.: altura de textarea). */
  inputStyle?: StyleProp<TextStyle>;
  testID?: string;
}

/**
 * Campo de texto com rótulo e mensagem de erro acessíveis.
 *
 * Acessibilidade:
 * - o rótulo é o `accessibilityLabel` do input;
 * - o erro é anunciado via `accessibilityHint` e `aria-invalid`;
 * - a borda muda de cor **e** o texto de erro aparece (não depende só de cor).
 */
export const TextField = forwardRef<ComponentRef<typeof TextInput>, TextFieldProps>(
  function TextField({ label, error, hint, inputStyle, testID, onFocus, onBlur, ...props }, ref) {
    const [focado, setFocado] = useState(false);
    const mensagem = error ?? hint;

    return (
      <View style={styles.container}>
        <Text style={styles.label}>{label}</Text>
        <TextInput
          ref={ref}
          testID={testID}
          accessibilityLabel={label}
          accessibilityHint={mensagem}
          aria-invalid={Boolean(error)}
          placeholderTextColor={colors.mutedInk}
          style={[
            styles.input,
            focado && styles.inputFocado,
            Boolean(error) && styles.inputErro,
            inputStyle,
          ]}
          onFocus={(evento) => {
            setFocado(true);
            onFocus?.(evento);
          }}
          onBlur={(evento) => {
            setFocado(false);
            onBlur?.(evento);
          }}
          {...props}
        />
        {mensagem ? (
          <Text
            style={[styles.mensagem, Boolean(error) && styles.mensagemErro]}
            accessibilityLiveRegion="polite"
          >
            {mensagem}
          </Text>
        ) : null}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  label: {
    ...typography.label,
    color: colors.ink,
  },
  input: {
    minHeight: minTouchTarget,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
    color: colors.ink,
  },
  inputFocado: {
    borderColor: colors.chalkboardRaised,
  },
  inputErro: {
    borderColor: colors.chalkCoral,
  },
  mensagem: {
    ...typography.caption,
    color: colors.mutedInk,
  },
  mensagemErro: {
    color: colors.ink,
    fontWeight: '600',
  },
});
