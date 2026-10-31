import { render, screen } from '@testing-library/react-native';

import { BrandMark } from './BrandMark';

/**
 * A marca é decorativa (oculta da árvore de acessibilidade), então as consultas
 * precisam de `includeHiddenElements` para encontrá-la.
 */
const consultarMarca = () => screen.getByTestId('marca', { includeHiddenElements: true });

describe('BrandMark', () => {
  it('renderiza a imagem da marca', async () => {
    await render(<BrandMark testID="marca" />);

    expect(consultarMarca()).toBeOnTheScreen();
  });

  it('é decorativa: não é anunciada pelo leitor de tela', async () => {
    await render(<BrandMark testID="marca" />);

    const imagem = consultarMarca();
    expect(imagem.props.accessible).toBe(false);
    expect(imagem.props.accessibilityElementsHidden).toBe(true);
    expect(imagem.props.importantForAccessibility).toBe('no');
  });

  it('aplica o tamanho informado', async () => {
    await render(<BrandMark size={40} testID="marca" />);

    expect(consultarMarca()).toHaveStyle({ width: 40, height: 40 });
  });
});
