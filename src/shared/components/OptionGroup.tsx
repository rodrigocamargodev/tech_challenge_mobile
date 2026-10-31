import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, minTouchTarget, radius, spacing, typography } from '@/core/theme/tokens';

export interface OpcaoGrupo<T extends string> {
  value: T;
  label: string;
}

export interface OptionGroupProps<T extends string> {
  /** Rótulo do grupo (associado ao conjunto de opções). */
  label: string;
  options: readonly OpcaoGrupo<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  /** Texto auxiliar exibido abaixo das opções. */
  hint?: string;
  testID?: string;
}

/**
 * Grupo de opções exclusivas (filtro de papel, seleção de papel).
 *
 * Acessibilidade:
 * - o contêiner é `radiogroup` e cada opção é `radio` com estado `selected`;
 * - a seleção é comunicada por cor **e** por uma marca textual (✓);
 * - alvo de toque mínimo de 44pt;
 * - `disabled` propaga o estado para todas as opções.
 *
 * Implementado sem dependências externas: são poucas opções e o componente
 * nativo de seleção não é consistente entre Android e iOS.
 */
export function OptionGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  disabled = false,
  hint,
  testID,
}: OptionGroupProps<T>) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.opcoes} accessibilityRole="radiogroup" testID={testID}>
        {options.map((opcao) => {
          const selecionada = opcao.value === value;

          return (
            <Pressable
              key={opcao.value}
              testID={testID ? `${testID}-${opcao.value}` : undefined}
              onPress={() => onChange(opcao.value)}
              disabled={disabled}
              accessibilityRole="radio"
              accessibilityLabel={opcao.label}
              accessibilityState={{ selected: selecionada, disabled }}
              style={({ pressed }) => [
                styles.opcao,
                selecionada && styles.opcaoSelecionada,
                disabled && styles.desabilitada,
                pressed && !disabled && styles.pressionada,
              ]}
            >
              <Text style={[styles.opcaoTexto, selecionada && styles.opcaoTextoSelecionado]}>
                {selecionada ? '✓ ' : ''}
                {opcao.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  label: {
    ...typography.label,
    color: colors.ink,
  },
  opcoes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  opcao: {
    minHeight: minTouchTarget,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  opcaoSelecionada: {
    backgroundColor: colors.chalkboardRaised,
    borderColor: colors.chalkboardRaised,
  },
  opcaoTexto: {
    ...typography.label,
    color: colors.ink,
  },
  opcaoTextoSelecionado: {
    color: colors.chalkWhite,
  },
  desabilitada: {
    opacity: 0.6,
  },
  pressionada: {
    opacity: 0.85,
  },
  hint: {
    ...typography.caption,
    color: colors.mutedInk,
  },
});
