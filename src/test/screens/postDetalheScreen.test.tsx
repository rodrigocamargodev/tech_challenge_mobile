import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { ApiError } from '@/core/http/ApiError';
import { clearToken, saveToken } from '@/core/storage/secureTokenStorage';
import {
  postExemplo,
  renderComProvidersPosts,
  usuarioAluno,
  usuarioProfessor,
} from '@/test/postsTestUtils';

import PostDetalheScreen from '../../../app/(app)/posts/[id]';

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

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
    replace: jest.fn(),
    canGoBack: () => true,
  }),
  useLocalSearchParams: () => ({ id: 'p1' }),
  Redirect: () => null,
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const authService = require('@/features/auth/authService') as {
  buscarUsuarioAutenticado: jest.Mock;
};
// eslint-disable-next-line @typescript-eslint/no-require-imports
const postsService = require('@/features/posts/postsService') as {
  obterPost: jest.Mock;
  excluirPost: jest.Mock;
};

const autenticarComo = async (usuario: typeof usuarioAluno | typeof usuarioProfessor) => {
  await saveToken('token');
  authService.buscarUsuarioAutenticado.mockResolvedValue({ usuario });
};

beforeEach(async () => {
  jest.clearAllMocks();
  await clearToken();
});

describe('detalhe da postagem', () => {
  it('exibe estado de carregamento', async () => {
    await autenticarComo(usuarioAluno);
    postsService.obterPost.mockReturnValue(new Promise(() => {}));

    await renderComProvidersPosts(<PostDetalheScreen />);

    await waitFor(() => expect(screen.getByTestId('post-detalhe-carregando')).toBeOnTheScreen());
  });

  it('exibe título, autor, data e conteúdo', async () => {
    await autenticarComo(usuarioAluno);
    postsService.obterPost.mockResolvedValue(postExemplo);

    await renderComProvidersPosts(<PostDetalheScreen />);

    await waitFor(() => expect(screen.getByText('Introdução ao Node.js')).toBeOnTheScreen());
    expect(screen.getByText('João Professor')).toBeOnTheScreen();
    expect(screen.getByText(/Publicado em/)).toBeOnTheScreen();
    expect(screen.getByText(postExemplo.conteudo)).toBeOnTheScreen();
    expect(postsService.obterPost).toHaveBeenCalledWith('p1', expect.anything());
  });

  it('não exibe ações administrativas para o aluno', async () => {
    await autenticarComo(usuarioAluno);
    postsService.obterPost.mockResolvedValue(postExemplo);

    await renderComProvidersPosts(<PostDetalheScreen />);

    await waitFor(() => expect(screen.getByText('Introdução ao Node.js')).toBeOnTheScreen());
    expect(screen.queryByTestId('post-detalhe-editar')).toBeNull();
    expect(screen.queryByTestId('post-detalhe-excluir')).toBeNull();
  });

  it('exibe ações administrativas para o professor', async () => {
    await autenticarComo(usuarioProfessor);
    postsService.obterPost.mockResolvedValue(postExemplo);

    await renderComProvidersPosts(<PostDetalheScreen />);

    await waitFor(() => expect(screen.getByTestId('post-detalhe-editar')).toBeOnTheScreen());
    expect(screen.getByTestId('post-detalhe-excluir')).toBeOnTheScreen();
  });

  it('navega para a edição', async () => {
    await autenticarComo(usuarioProfessor);
    postsService.obterPost.mockResolvedValue(postExemplo);

    await renderComProvidersPosts(<PostDetalheScreen />);
    await waitFor(() => expect(screen.getByTestId('post-detalhe-editar')).toBeOnTheScreen());

    await fireEvent.press(screen.getByTestId('post-detalhe-editar'));

    expect(mockPush).toHaveBeenCalledWith('/posts/p1/editar');
  });

  it('exibe erro 404 com mensagem específica', async () => {
    await autenticarComo(usuarioAluno);
    postsService.obterPost.mockRejectedValue(
      new ApiError({ kind: 'http', status: 404, message: 'Postagem não encontrada.' })
    );

    await renderComProvidersPosts(<PostDetalheScreen />);

    await waitFor(() => expect(screen.getByTestId('post-detalhe-erro')).toBeOnTheScreen());
    expect(screen.getByText(/não existe mais/i)).toBeOnTheScreen();
  });

  it('exclui com confirmação e volta para a lista', async () => {
    await autenticarComo(usuarioProfessor);
    postsService.obterPost.mockResolvedValue(postExemplo);
    postsService.excluirPost.mockResolvedValue({ message: 'Postagem excluída com sucesso!' });

    await renderComProvidersPosts(<PostDetalheScreen />);
    await waitFor(() => expect(screen.getByTestId('post-detalhe-excluir')).toBeOnTheScreen());

    await fireEvent.press(screen.getByTestId('post-detalhe-excluir'));
    expect(screen.getByTestId('post-detalhe-confirmar-exclusao')).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('post-detalhe-confirmar-exclusao-confirmar'));

    await waitFor(() => expect(postsService.excluirPost).toHaveBeenCalledWith('p1', 'token'));
    await waitFor(() => expect(mockBack).toHaveBeenCalled());
  });

  it('exibe erro quando a exclusão falha', async () => {
    await autenticarComo(usuarioProfessor);
    postsService.obterPost.mockResolvedValue(postExemplo);
    postsService.excluirPost.mockRejectedValue(
      new ApiError({ kind: 'http', status: 404, message: 'Postagem não encontrada.' })
    );

    await renderComProvidersPosts(<PostDetalheScreen />);
    await waitFor(() => expect(screen.getByTestId('post-detalhe-excluir')).toBeOnTheScreen());

    await fireEvent.press(screen.getByTestId('post-detalhe-excluir'));
    await fireEvent.press(screen.getByTestId('post-detalhe-confirmar-exclusao-confirmar'));

    await waitFor(() => expect(screen.getByText(/não foi encontrada/i)).toBeOnTheScreen());
    expect(mockBack).not.toHaveBeenCalled();
  });
});
