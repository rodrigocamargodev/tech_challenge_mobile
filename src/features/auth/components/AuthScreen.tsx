import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, spacing, typography } from '@/core/theme/tokens';
import { BrandMark } from '@/shared/components/BrandMark';

export interface AuthScreenProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  /** Conteúdo exibido abaixo do formulário (ex.: link para outra tela). */
  footer?: ReactNode;
}

/**
 * Estrutura comum das telas públicas de autenticação.
 *
 * Cabeçalho institucional em verde-lousa e formulário em superfície clara,
 * conforme o design system "Lousa Moderna".
 */
export function AuthScreen({ title, subtitle, children, footer }: AuthScreenProps) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brand}>
            <BrandMark size={72} testID="auth-marca" />
            <Text style={styles.brandTitle} accessibilityRole="header">
              Blog de Giz
            </Text>
            <Text style={styles.brandSubtitle}>Conhecimento que fica na lousa</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.title} accessibilityRole="header">
              {title}
            </Text>
            <Text style={styles.subtitle}>{subtitle}</Text>

            <View style={styles.form}>{children}</View>
          </View>

          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.chalkboard,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    padding: spacing.lg,
    gap: spacing.xl,
    justifyContent: 'center',
  },
  brand: {
    gap: spacing.xs,
  },
  brandTitle: {
    ...typography.display,
    color: colors.chalkWhite,
  },
  brandSubtitle: {
    ...typography.body,
    color: colors.chalkBlue,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  title: {
    ...typography.title,
    color: colors.ink,
  },
  subtitle: {
    ...typography.body,
    color: colors.mutedInk,
  },
  form: {
    marginTop: spacing.md,
    gap: spacing.lg,
  },
  footer: {
    alignItems: 'center',
    gap: spacing.sm,
  },
});
