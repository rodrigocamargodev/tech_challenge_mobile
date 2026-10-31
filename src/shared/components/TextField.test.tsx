import { fireEvent, render, screen } from '@testing-library/react-native';

import { TextField } from './TextField';

describe('TextField', () => {
  it('expõe o rótulo como accessibilityLabel', async () => {
    await render(<TextField label="E-mail" testID="campo" />);

    expect(screen.getByLabelText('E-mail')).toBeOnTheScreen();
  });

  it('exibe a dica quando não há erro', async () => {
    await render(<TextField label="Senha" hint="Entre 8 e 72 caracteres." />);

    expect(screen.getByText('Entre 8 e 72 caracteres.')).toBeOnTheScreen();
  });

  it('prioriza a mensagem de erro sobre a dica', async () => {
    await render(
      <TextField label="Senha" hint="Dica" error="A senha é obrigatória." testID="campo" />
    );

    expect(screen.getByText('A senha é obrigatória.')).toBeOnTheScreen();
    expect(screen.queryByText('Dica')).toBeNull();
    expect(screen.getByTestId('campo').props['aria-invalid']).toBe(true);
  });

  it('propaga a digitação para o consumidor', async () => {
    const onChangeText = jest.fn();

    await render(<TextField label="Nome" testID="campo" onChangeText={onChangeText} />);
    await fireEvent.changeText(screen.getByTestId('campo'), 'Maria');

    expect(onChangeText).toHaveBeenCalledWith('Maria');
  });

  it('notifica foco e desfoque', async () => {
    const onFocus = jest.fn();
    const onBlur = jest.fn();

    await render(
      <TextField label="Nome" testID="campo" onFocus={onFocus} onBlur={onBlur} />
    );

    await fireEvent(screen.getByTestId('campo'), 'focus');
    await fireEvent(screen.getByTestId('campo'), 'blur');

    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(onBlur).toHaveBeenCalledTimes(1);
  });
});
