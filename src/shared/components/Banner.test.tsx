import { render, screen } from '@testing-library/react-native';

import { Banner } from './Banner';

describe('Banner', () => {
  it('anuncia erro como alerta', async () => {
    await render(<Banner message="Falhou." variant="error" testID="banner" />);

    expect(screen.getByTestId('banner').props.accessibilityRole).toBe('alert');
  });

  it('anuncia sucesso como texto (não como alerta)', async () => {
    await render(<Banner message="Feito." variant="success" testID="banner" />);

    expect(screen.getByTestId('banner').props.accessibilityRole).toBe('text');
    expect(screen.getByText('Feito.')).toBeOnTheScreen();
  });

  it('diferencia visualmente sucesso de informação', async () => {
    const { rerender } = await render(
      <Banner message="Ok." variant="success" testID="banner" />
    );
    const estiloSucesso = screen.getByTestId('banner').props.style;

    await rerender(<Banner message="Info." variant="info" testID="banner" />);
    const estiloInfo = screen.getByTestId('banner').props.style;

    expect(estiloSucesso).not.toEqual(estiloInfo);
  });
});
