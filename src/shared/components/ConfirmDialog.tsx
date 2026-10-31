import { Modal, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/core/theme/tokens';

import { Button } from './Button';

export interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Exibe indicador de carregamento e bloqueia os botões. */
  loading?: boolean;
  /** `true` para ações destrutivas (exclusão). */
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  testID?: string;
}

/**
 * Diálogo de confirmação para ações destrutivas.
 *
 * Usa `Modal` nativo com `accessibilityViewIsModal` para prender o foco do
 * leitor de tela. O botão de cancelar vem primeiro na ordem de leitura, o que
 * reduz o risco de exclusão acidental.
 */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  loading = false,
  destructive = false,
  onConfirm,
  onCancel,
  testID,
}: ConfirmDialogProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      accessibilityViewIsModal
    >
      <View style={styles.overlay}>
        <View style={styles.card} testID={testID} accessibilityRole="alert">
          <Text style={styles.titulo} accessibilityRole="header">
            {title}
          </Text>
          <Text style={styles.mensagem}>{message}</Text>

          <View style={styles.acoes}>
            <Button
              label={cancelLabel}
              variant="secondary"
              onPress={onCancel}
              disabled={loading}
              testID={testID ? `${testID}-cancelar` : undefined}
            />
            <Button
              label={confirmLabel}
              variant={destructive ? 'danger' : 'primary'}
              onPress={onConfirm}
              loading={loading}
              testID={testID ? `${testID}-confirmar` : undefined}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 46, 38, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  titulo: {
    ...typography.subtitle,
    color: colors.ink,
  },
  mensagem: {
    ...typography.body,
    color: colors.mutedInk,
  },
  acoes: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
});
