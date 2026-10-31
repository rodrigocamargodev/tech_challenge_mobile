/**
 * Design tokens — "Lousa Moderna".
 *
 * Fonte única de verdade para cores, espaçamentos, tipografia e raios.
 * Nenhum componente deve declarar valores de cor/espaçamento literais.
 */

export const colors = {
  /** Fundo institucional (verde-lousa). */
  chalkboard: '#1A2E26',
  /** Superfícies escuras sobre o fundo institucional. */
  chalkboardRaised: '#233D33',
  /** Texto sobre fundo escuro. */
  chalkWhite: '#F7F9F6',
  /** Fundo de leitura. */
  paper: '#F4F5F0',
  /** Cards e formulários. */
  surface: '#FFFFFF',
  /** Texto principal. */
  ink: '#18231E',
  /** Texto secundário. */
  mutedInk: '#53635B',
  /** Ações principais. */
  chalkYellow: '#F4D068',
  /** Tags e informações. */
  chalkBlue: '#A4C3D2',
  /** Erros e exclusões. */
  chalkCoral: '#FF9F9F',
  /** Bordas. */
  border: '#D9E0DA',
} as const;

export type ColorToken = keyof typeof colors;

/**
 * Cores de texto sobre cada superfície, garantindo contraste.
 * Usado por componentes que precisam escolher a cor do texto dinamicamente.
 */
export const textOn = {
  chalkboard: colors.chalkWhite,
  chalkboardRaised: colors.chalkWhite,
  paper: colors.ink,
  surface: colors.ink,
  chalkYellow: colors.ink,
  chalkBlue: colors.ink,
  chalkCoral: colors.ink,
} as const;

/** Escala de espaçamento (múltiplos de 4). */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

/** Raios de canto — discretamente arredondados. */
export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  pill: 999,
} as const;

/**
 * Tipografia. `fontSize` é base; o texto escala com a configuração do sistema
 * (allowFontScaling permanece habilitado por padrão).
 */
export const typography = {
  display: { fontSize: 30, lineHeight: 38, fontWeight: '700' },
  title: { fontSize: 22, lineHeight: 30, fontWeight: '700' },
  subtitle: { fontSize: 18, lineHeight: 26, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  bodyStrong: { fontSize: 16, lineHeight: 24, fontWeight: '600' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  label: { fontSize: 14, lineHeight: 20, fontWeight: '600' },
} as const;

/** Alvo de toque mínimo recomendado (WCAG / Material). */
export const minTouchTarget = 44;

export const theme = {
  colors,
  textOn,
  spacing,
  radius,
  typography,
  minTouchTarget,
} as const;

export type Theme = typeof theme;
