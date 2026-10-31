import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { ApiError } from '@/core/http/ApiError';
import { clearToken, saveToken } from '@/core/storage/secureTokenStorage';
import { postsKeys } from '@/features/posts/queries';
import {
  postExemplo,
  renderComProvidersPosts,
  usuarioAluno,
  usuarioProfessor,
} from '@/test/postsTestUtils';

import EditarPostagemScreen from '../../../app/(app)/posts/[id]/editar';
import NovaPostagemScreen from '../../../app/(app)/posts/novo';

jest.mock('@/features/auth/authService', () => ({
  login: jest.fn(),
  cadastrarAluno: jest.fn(),
  buscarUsuarioAutenticado: jest.fn(),
}));

jest.mock('@/features/posts/postsService', () => ({
  listarPosts: jest.fn(),
  buscarPosts: jest.fn(),
  obterPost: jest.fn(),
  criarPost: jest.fn(),
  atualizarPost: jest.fn(),
  excluirPost: jest.fn(),
}));

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockRedirect = jest.fn();

jest.mock('expo-router', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');

  return {
    useRouter: () => ({
      push: mockPush,
      back: mockBack,
      replace: mockReplace,
      canGoBack: () => true,
    }),
    useLocalSearchParams: () => ({ id: 'p1' }),
    Redirect: ({ href }: { href: string }) => {
      mockRedirect(href);
      return React.createElement(Text, null, `redirect:${href}`);
    },
  };
});

// eslint-disable-next-line @typescript-eslint/no-require-imports
const authService = require('@/features/auth/authService') as {
  buscarUsuarioAutenticado: jest.Mock;
};
// eslint-disable-next-line @typescript-eslint/no-require-imports
const postsService = require('@/features/posts/postsService') as {
  obterPost: jest.Mock;
  criarPost: jest.Mock;
  atualizarPost: jest.Mock;
};

const autenticarComo = async (usuario: typeof usuarioAluno | typeof usuarioProfessor) => {
  await saveToken('token');
  authService.buscarUsuarioAutenticado.mockResolvedValue({ usuario });
};

beforeEach(async () => {
  jest.clearAllMocks();
  await clearToken();
});

describe('criação de postagem (professor)', () => {
  it('bloqueia o aluno e redireciona para a home', async () => {
    await autenticarComo(usuarioAluno);

    await renderComProvidersPosts(<NovaPostagemScreen />);

    await waitFor(() => expect(mockRedirect).toHaveBeenCalledWith('/'));
    expect(screen.queryByTestId('post-titulo')).toBeNull();
  });

  it('valida campos vazios antes de chamar a API', async () => {
    await autenticarComo(usuarioProfessor);

    await renderComProvidersPosts(<NovaPostagemScreen />);
    await waitFor(() => expect(screen.getByTestId('post-titulo')).toBeOnTheScreen());

    await fireEvent.press(screen.getByTestId('post-submit'));

    await waitFor(() =>
      expect(screen.getByText('Informe o título da postagem.')).toBeOnTheScreen()
    );
    expect(screen.getByText('Informe o conteúdo da postagem.')).toBeOnTheScreen();
    expect(postsService.criarPost).not.toHaveBeenCalled();
  });

  it('cria a postagem sem enviar autor e invalida o cache', async () => {
    await autenticarComo(usuarioProfessor);
    postsService.criarPost.mockResolvedValue(postExemplo);

    const { queryClient } = await renderComProvidersPosts(<NovaPostagemScreen />);
    await waitFor(() => expect(screen.getByTestId('post-titulo')).toBeOnTheScreen());

    const invalidar = jest.spyOn(queryClient, 'invalidateQueries');

    await fireEvent.changeText(screen.getByTestId('post-titulo'), 'Introdução ao Node.js');
    await fireEvent.changeText(screen.getByTestId('post-conteudo'), 'Conteúdo da aula.');
    await fireEvent.press(screen.getByTestId('post-submit'));

    await waitFor(() =>
      expect(postsService.criarPost).toHaveBeenCalledWith(
        { titulo: 'Introdução ao Node.js', conteudo: 'Conteúdo da aula.' },
        'token'
      )
    );
    await waitFor(() => expect(invalidar).toHaveBeenCalledWith({ queryKey: postsKeys.all }));
    await waitFor(() => expect(mockBack).toHaveBeenCalled());
  });

  it('associa erros 422 do backend aos campos', async () => {
    await autenticarComo(usuarioProfessor);
    postsService.criarPost.mockRejectedValue(
      new ApiError({
        kind: 'http',
        status: 422,
        message: 'Dados inválidos na requisição.',
        detalhes: [{ campo: 'titulo', mensagem: 'Título já utilizado.' }],
      })
    );

    await renderComProvidersPosts(<NovaPostagemScreen />);
    await waitFor(() => expect(screen.getByTestId('post-titulo')).toBeOnTheScreen());

    await fireEvent.changeText(screen.getByTestId('post-titulo'), 'Título');
    await fireEvent.changeText(screen.getByTestId('post-conteudo'), 'Conteúdo');
    await fireEvent.press(screen.getByTestId('post-submit'));

    await waitFor(() => expect(screen.getByText('Título já utilizado.')).toBeOnTheScreen());
    expect(screen.getByTestId('post-novo-erro')).toHaveTextContent(
      'Dados inválidos na requisição.'
    );
  });

  it('exibe erro de permissão (403)', async () => {
    await autenticarComo(usuarioProfessor);
    postsService.criarPost.mockRejectedValue(
      new ApiError({ kind: 'http', status: 403, message: 'Acesso negado.' })
    );

    await renderComProvidersPosts(<NovaPostagemScreen />);
    await waitFor(() => expect(screen.getByTestId('post-titulo')).toBeOnTheScreen());

    await fireEvent.changeText(screen.getByTestId('post-titulo'), 'Título');
    await fireEvent.changeText(screen.getByTestId('post-conteudo'), 'Conteúdo');
    await fireEvent.press(screen.getByTestId('post-submit'));

    await waitFor(() =>
      expect(screen.getByTestId('post-novo-erro')).toHaveTextContent(/não tem permissão/i)
    );
  });
});

describe('edição de postagem (professor)', () => {
  it('bloqueia o aluno e redireciona para a home', async () => {
    await autenticarComo(usuarioAluno);

    await renderComProvidersPosts(<EditarPostagemScreen />);

    await waitFor(() => expect(mockRedirect).toHaveBeenCalledWith('/'));
    expect(screen.queryByTestId('post-titulo')).toBeNull();
  });

  it('pré-preenche o formulário com os dados atuais', async () => {
    await autenticarComo(usuarioProfessor);
    postsService.obterPost.mockResolvedValue(postExemplo);

    await renderComProvidersPosts(<EditarPostagemScreen />);

    await waitFor(() =>
      expect(screen.getByTestId('post-titulo')).toHaveDisplayValue('Introdução ao Node.js')
    );
    expect(screen.getByTestId('post-conteudo')).toHaveDisplayValue(postExemplo.conteudo);
  });

  it('salva as alterações e invalida o cache', async () => {
    await autenticarComo(usuarioProfessor);
    postsService.obterPost.mockResolvedValue(postExemplo);
    postsService.atualizarPost.mockResolvedValue({
      ...postExemplo,
      titulo: 'Título atualizado',
      atualizadoEm: '2026-02-01T00:00:00.000Z',
    });

    const { queryClient } = await renderComProvidersPosts(<EditarPostagemScreen />);
    await waitFor(() =>
      expect(screen.getByTestId('post-titulo')).toHaveDisplayValue('Introdução ao Node.js')
    );

    const invalidar = jest.spyOn(queryClient, 'invalidateQueries');

    await fireEvent.changeText(screen.getByTestId('post-titulo'), 'Título atualizado');
    await fireEvent.press(screen.getByTestId('post-submit'));

    await waitFor(() =>
      expect(postsService.atualizarPost).toHaveBeenCalledWith(
        'p1',
        { titulo: 'Título atualizado', conteudo: postExemplo.conteudo },
        'token'
      )
    );
    await waitFor(() => expect(invalidar).toHaveBeenCalledWith({ queryKey: postsKeys.all }));
    await waitFor(() => expect(mockBack).toHaveBeenCalled());
  });

  it('exibe erro 404 quando a postagem não existe mais', async () => {
    await autenticarComo(usuarioProfessor);
    postsService.obterPost.mockRejectedValue(
      new ApiError({ kind: 'http', status: 404, message: 'Postagem não encontrada.' })
    );

    await renderComProvidersPosts(<EditarPostagemScreen />);

    await waitFor(() => expect(screen.getByTestId('post-editar-erro')).toBeOnTheScreen());
    expect(screen.getByText(/não existe mais/i)).toBeOnTheScreen();
  });

  it('exibe erro ao falhar a atualização', async () => {
    await autenticarComo(usuarioProfessor);
    postsService.obterPost.mockResolvedValue(postExemplo);
    postsService.atualizarPost.mockRejectedValue(
      new ApiError({ kind: 'network', message: 'Sem conexão.' })
    );

    await renderComProvidersPosts(<EditarPostagemScreen />);
    await waitFor(() =>
      expect(screen.getByTestId('post-titulo')).toHaveDisplayValue('Introdução ao Node.js')
    );

    await fireEvent.press(screen.getByTestId('post-submit'));

    await waitFor(() =>
      expect(screen.getByTestId('post-editar-erro-banner')).toHaveTextContent(
        /conectar ao servidor/i
      )
    );
  });
});
