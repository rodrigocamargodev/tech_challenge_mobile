import { colors, minTouchTarget, radius, spacing, textOn, theme, typography } from './tokens';

describe('design tokens — Lousa Moderna', () => {
  it('define a paleta completa especificada', () => {
    expect(colors).toEqual({
      chalkboard: '#1A2E26',
      chalkboardRaised: '#233D33',
      chalkWhite: '#F7F9F6',
      paper: '#F4F5F0',
      surface: '#FFFFFF',
      ink: '#18231E',
      mutedInk: '#53635B',
      chalkYellow: '#F4D068',
      chalkBlue: '#A4C3D2',
      chalkCoral: '#FF9F9F',
      border: '#D9E0DA',
    });
  });

  it('usa texto claro sobre superfícies escuras e escuro sobre claras', () => {
    expect(textOn.chalkboard).toBe(colors.chalkWhite);
    expect(textOn.chalkboardRaised).toBe(colors.chalkWhite);
    expect(textOn.surface).toBe(colors.ink);
    expect(textOn.paper).toBe(colors.ink);
    expect(textOn.chalkYellow).toBe(colors.ink);
  });

  it('mantém a escala de espaçamento crescente', () => {
    const valores = Object.values(spacing);

    expect(valores).toEqual([...valores].sort((a, b) => a - b));
    expect(spacing.xs).toBe(4);
  });

  it('define alvo de toque mínimo acessível', () => {
    expect(minTouchTarget).toBeGreaterThanOrEqual(44);
  });

  it('expõe todos os grupos no objeto de tema', () => {
    expect(theme.colors).toBe(colors);
    expect(theme.spacing).toBe(spacing);
    expect(theme.radius).toBe(radius);
    expect(theme.typography).toBe(typography);
  });

  it('mantém raios discretos', () => {
    expect(radius.sm).toBeLessThan(radius.md);
    expect(radius.md).toBeLessThan(radius.lg);
  });
});
