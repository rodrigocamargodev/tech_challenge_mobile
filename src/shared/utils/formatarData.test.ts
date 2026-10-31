import { formatarData, resumirTexto } from './formatarData';

describe('formatarData', () => {
  it('formata uma data ISO válida', () => {
    expect(formatarData('2026-01-10T12:00:00.000Z')).toMatch(/2026/);
  });

  it('devolve string vazia para data inválida', () => {
    expect(formatarData('não é data')).toBe('');
  });
});

describe('resumirTexto', () => {
  it('mantém textos curtos intactos', () => {
    expect(resumirTexto('Texto curto', 50)).toBe('Texto curto');
  });

  it('normaliza espaços em branco', () => {
    expect(resumirTexto('  Texto   com   espaços  ', 50)).toBe('Texto com espaços');
  });

  it('corta no limite sem quebrar palavras e adiciona reticências', () => {
    const resultado = resumirTexto('palavra '.repeat(30), 40);

    expect(resultado.endsWith('…')).toBe(true);
    expect(resultado.length).toBeLessThanOrEqual(41);
    expect(resultado).not.toMatch(/palavr…$/);
  });
});
