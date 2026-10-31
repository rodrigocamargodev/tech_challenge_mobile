import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { ApiError } from '@/core/http/ApiError';
import { clearToken, saveToken } from '@/core/storage/secureTokenStorage';
import { postsKeys } from '@/features/posts/queries';
import {
  outroPost,
  postExemplo,
  renderComProvidersPosts,
  usuarioAluno,
  usuarioProfessor,
} from '@/test/postsTestUtils';

import PostsScreen from '../../../app/(app)/index';

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

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn(), replace: jest.fn(), canGoBack: () => true }),
  useLocalSearchParams: () => ({}),
  Redirect: () => null,
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const authService = require('@/features/auth/authService') as {
  buscarUsuarioAutenticado: jest.Mock;
};
// eslint-disable-next-line @typescript-eslint/no-require-imports
const postsService = require('@/features/posts/postsService') as {
  listarPosts: jest.Mock;
  buscarPosts: jest.Mock;
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

describe('listagem de postagens', () => {
  it('exibe estado de carregamento antes da resposta', async () => {
    await autenticarComo(usuarioAluno);
    postsService.listarPosts.mockReturnValue(new Promise(() => {}));

    await renderComProvidersPosts(<PostsScreen />);

    await waitFor(() => expect(screen.getByTestId('posts-carregando')).toBeOnTheScreen());
  });

  it('lista as postagens para o aluno', async () => {
    await autenticarComo(usuarioAluno);
    postsService.listarPosts.mockResolvedValue([postExemplo, outroPost]);

    await renderComProvidersPosts(<PostsScreen />);

    await waitFor(() => expect(screen.getByText('Introdução ao Node.js')).toBeOnTheScreen());
    expect(screen.getByText('Lousa Moderna')).toBeOnTheScreen();
    // O autor aparece em cada card.
    expect(screen.getAllByText('João Professor')).toHaveLength(2);
  });

  it('não exibe ações administrativas para o aluno', async () => {
    await autenticarComo(usuarioAluno);
    postsService.listarPosts.mockResolvedValue([postExemplo]);

    await renderComProvidersPosts(<PostsScreen />);

    await waitFor(() => expect(screen.getByText('Introdução ao Node.js')).toBeOnTheScreen());
    expect(screen.queryByTestId('posts-nova')).toBeNull();
    expect(screen.queryByLabelText(/Editar postagem/)).toBeNull();
    expect(screen.queryByLabelText(/Excluir postagem/)).toBeNull();
  });

  it('exibe ações administrativas para o professor', async () => {
    await autenticarComo(usuarioProfessor);
    postsService.listarPosts.mockResolvedValue([postExemplo]);

    await renderComProvidersPosts(<PostsScreen />);

    await waitFor(() => expect(screen.getByTestId('posts-nova')).toBeOnTheScreen());
    expect(screen.getByLabelText(/Editar postagem/)).toBeOnTheScreen();
    expect(screen.getByLabelText(/Excluir postagem/)).toBeOnTheScreen();
  });

  it('mostra estado vazio orientativo quando não há postagens', async () => {
    await autenticarComo(usuarioAluno);
    postsService.listarPosts.mockResolvedValue([]);

    await renderComProvidersPosts(<PostsScreen />);

    await waitFor(() => expect(screen.getByTestId('posts-vazio')).toBeOnTheScreen());
    expect(screen.getByText(/Volte mais tarde/i)).toBeOnTheScreen();
  });

  it('mostra estado de erro com opção de tentar novamente', async () => {
    await autenticarComo(usuarioAluno);
    postsService.listarPosts.mockRejectedValue(
      new ApiError({ kind: 'network', message: 'Sem conexão.' })
    );

    await renderComProvidersPosts(<PostsScreen />);

    await waitFor(() => expect(screen.getByTestId('posts-erro')).toBeOnTheScreen());
    expect(screen.getByText(/conectar ao servidor/i)).toBeOnTheScreen();
    expect(screen.getByTestId('posts-erro-retry')).toBeOnTheScreen();
  });

  it('abre o detalhe ao tocar em um card', async () => {
    await autenticarComo(usuarioAluno);
    postsService.listarPosts.mockResolvedValue([postExemplo]);

    await renderComProvidersPosts(<PostsScreen />);
    await waitFor(() => expect(screen.getByText('Introdução ao Node.js')).toBeOnTheScreen());

    await fireEvent.press(screen.getByLabelText('Abrir postagem: Introdução ao Node.js'));

    expect(mockPush).toHaveBeenCalledWith('/posts/p1');
  });
});

describe('busca de postagens', () => {
  it('usa o endpoint de busca após o debounce e atualiza a listagem', async () => {
    await autenticarComo(usuarioAluno);
    postsService.listarPosts.mockResolvedValue([postExemplo, outroPost]);
    postsService.buscarPosts.mockResolvedValue([outroPost]);

    await renderComProvidersPosts(<PostsScreen />);
    await waitFor(() => expect(screen.getByText('Introdução ao Node.js')).toBeOnTheScreen());

    await fireEvent.changeText(screen.getByTestId('posts-busca'), 'lousa');

    await waitFor(() => expect(postsService.buscarPosts).toHaveBeenCalledWith('lousa', expect.anything()));
    await waitFor(() => expect(screen.queryByText('Introdução ao Node.js')).toBeNull());
    expect(screen.getByText('Lousa Moderna')).toBeOnTheScreen();
  });

  it('mostra estado vazio específico quando a busca não retorna resultados', async () => {
    await autenticarComo(usuarioAluno);
    postsService.listarPosts.mockResolvedValue([postExemplo]);
    postsService.buscarPosts.mockResolvedValue([]);

    await renderComProvidersPosts(<PostsScreen />);
    await waitFor(() => expect(screen.getByText('Introdução ao Node.js')).toBeOnTheScreen());

    await fireEvent.changeText(screen.getByTestId('posts-busca'), 'inexistente');

    await waitFor(() => expect(screen.getByTestId('posts-vazio-busca')).toBeOnTheScreen());
    expect(screen.getByText(/Não encontramos resultados/i)).toBeOnTheScreen();
  });

  it('limpa a busca e volta à listagem completa', async () => {
    await autenticarComo(usuarioAluno);
    postsService.listarPosts.mockResolvedValue([postExemplo, outroPost]);
    postsService.buscarPosts.mockResolvedValue([outroPost]);

    await renderComProvidersPosts(<PostsScreen />);
    await waitFor(() => expect(screen.getByText('Introdução ao Node.js')).toBeOnTheScreen());

    await fireEvent.changeText(screen.getByTestId('posts-busca'), 'lousa');
    await waitFor(() => expect(screen.queryByText('Introdução ao Node.js')).toBeNull());

    // Botão "Limpar busca" do cabeçalho (a lista não está vazia neste cenário).
    await fireEvent.press(screen.getByLabelText('Limpar busca'));

    await waitFor(() => expect(screen.getByText('Introdução ao Node.js')).toBeOnTheScreen());
  });

  it('exibe erro da busca', async () => {
    await autenticarComo(usuarioAluno);
    postsService.listarPosts.mockResolvedValue([postExemplo]);
    postsService.buscarPosts.mockRejectedValue(
      new ApiError({ kind: 'http', status: 500, message: 'Erro interno.' })
    );

    await renderComProvidersPosts(<PostsScreen />);
    await waitFor(() => expect(screen.getByText('Introdução ao Node.js')).toBeOnTheScreen());

    await fireEvent.changeText(screen.getByTestId('posts-busca'), 'erro');

    await waitFor(() => expect(screen.getByTestId('posts-erro')).toBeOnTheScreen());
    expect(screen.getByText(/Não foi possível buscar/i)).toBeOnTheScreen();
  });
});

describe('exclusão de postagem (professor)', () => {
  it('pede confirmação antes de excluir', async () => {
    await autenticarComo(usuarioProfessor);
    postsService.listarPosts.mockResolvedValue([postExemplo]);

    await renderComProvidersPosts(<PostsScreen />);
    await waitFor(() => expect(screen.getByText('Introdução ao Node.js')).toBeOnTheScreen());

    await fireEvent.press(screen.getByLabelText('Excluir postagem: Introdução ao Node.js'));

    expect(screen.getByTestId('posts-confirmar-exclusao')).toBeOnTheScreen();
    expect(postsService.excluirPost).not.toHaveBeenCalled();
  });

  it('cancela a exclusão sem chamar a API', async () => {
    await autenticarComo(usuarioProfessor);
    postsService.listarPosts.mockResolvedValue([postExemplo]);

    await renderComProvidersPosts(<PostsScreen />);
    await waitFor(() => expect(screen.getByText('Introdução ao Node.js')).toBeOnTheScreen());

    await fireEvent.press(screen.getByLabelText('Excluir postagem: Introdução ao Node.js'));
    await fireEvent.press(screen.getByTestId('posts-confirmar-exclusao-cancelar'));

    expect(postsService.excluirPost).not.toHaveBeenCalled();
  });

  it('exclui após confirmação e invalida o cache', async () => {
    await autenticarComo(usuarioProfessor);
    postsService.listarPosts.mockResolvedValue([postExemplo]);
    postsService.excluirPost.mockResolvedValue({ message: 'Postagem excluída com sucesso!' });

    const { queryClient } = await renderComProvidersPosts(<PostsScreen />);
    await waitFor(() => expect(screen.getByText('Introdução ao Node.js')).toBeOnTheScreen());

    const invalidar = jest.spyOn(queryClient, 'invalidateQueries');

    await fireEvent.press(screen.getByLabelText('Excluir postagem: Introdução ao Node.js'));
    await fireEvent.press(screen.getByTestId('posts-confirmar-exclusao-confirmar'));

    await waitFor(() => expect(postsService.excluirPost).toHaveBeenCalledWith('p1', 'token'));
    await waitFor(() =>
      expect(invalidar).toHaveBeenCalledWith({ queryKey: postsKeys.all })
    );
  });

  it('exibe erro quando a exclusão falha', async () => {
    await autenticarComo(usuarioProfessor);
    postsService.listarPosts.mockResolvedValue([postExemplo]);
    postsService.excluirPost.mockRejectedValue(
      new ApiError({ kind: 'http', status: 403, message: 'Acesso negado.' })
    );

    await renderComProvidersPosts(<PostsScreen />);
    await waitFor(() => expect(screen.getByText('Introdução ao Node.js')).toBeOnTheScreen());

    await fireEvent.press(screen.getByLabelText('Excluir postagem: Introdução ao Node.js'));
    await fireEvent.press(screen.getByTestId('posts-confirmar-exclusao-confirmar'));

    await waitFor(() => expect(screen.getByText(/não tem permissão/i)).toBeOnTheScreen());
  });
});
