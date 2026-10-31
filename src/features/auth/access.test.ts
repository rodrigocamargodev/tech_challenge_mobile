import { podeAcessar, rotaInicial } from './access';
import type { Usuario } from './types';

const criarUsuario = (role: Usuario['role']): Usuario => ({
  _id: '1',
  nome: 'Teste',
  email: 'teste@escola.com',
  role,
  ativo: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
});

describe('podeAcessar', () => {
  it('permite rotas públicas para qualquer visitante', () => {
    expect(podeAcessar(null, 'publica')).toBe(true);
  });

  it('bloqueia rotas autenticadas sem usuário', () => {
    expect(podeAcessar(null, 'autenticada')).toBe(false);
  });

  it('permite rotas autenticadas para aluno e professor', () => {
    expect(podeAcessar(criarUsuario('aluno'), 'autenticada')).toBe(true);
    expect(podeAcessar(criarUsuario('professor'), 'autenticada')).toBe(true);
  });

  it('bloqueia rotas de professor para aluno', () => {
    expect(podeAcessar(criarUsuario('aluno'), 'professor')).toBe(false);
  });

  it('permite rotas de professor para professor', () => {
    expect(podeAcessar(criarUsuario('professor'), 'professor')).toBe(true);
  });

  it('bloqueia rotas de professor sem usuário', () => {
    expect(podeAcessar(null, 'professor')).toBe(false);
  });
});

describe('rotaInicial', () => {
  it('aponta para a home quando autenticado', () => {
    expect(rotaInicial('authenticated')).toBe('/');
  });

  it('aponta para o login nos demais estados', () => {
    expect(rotaInicial('unauthenticated')).toBe('/login');
    expect(rotaInicial('restoring')).toBe('/login');
  });
});
