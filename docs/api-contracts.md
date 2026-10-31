# Contratos da API — Blog de Giz

Documento derivado da leitura do código real do backend (`/home/rodrigo/github/tech_challenge_2`, branch `develop`).
Em caso de divergência com qualquer outro documento, **prevalece o código do backend**.

- Base URL local: `http://localhost:3000`
- Content-Type: `application/json`
- Autenticação: `Authorization: Bearer <token>`
- JWT expira em 8h (configurável por `JWT_EXPIRES_IN`). Não há refresh token.

---

## 1. Tipos

### `Papel`

```ts
type Papel = 'professor' | 'aluno';
```

### `UsuarioPublico`

```ts
interface UsuarioPublico {
  _id: string;
  nome: string;
  email: string;
  role: Papel;
  ativo: boolean;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}
```

`passwordHash` nunca é retornado.

### `Post`

```ts
interface Post {
  _id: string;
  titulo: string;
  conteudo: string;
  autor: string; // nome do professor autenticado no momento da criação
  autorId?: string; // ObjectId do autor
  criadoEm: string; // ISO 8601
  atualizadoEm: string; // ISO 8601
}
```

### `Erro`

```ts
interface ErroApi {
  error: string;
  detalhes?: Array<{ campo: string; mensagem: string }>;
}
```

---

## 2. Autenticação

### `POST /auth/register` — público

Cria **sempre** um aluno. Campo `role` enviado é ignorado.

**Request**

```json
{ "nome": "Maria Silva", "email": "maria@escola.com", "senha": "senhaSegura123" }
```

| Campo   | Tipo   | Regras                                     |
| ------- | ------ | ------------------------------------------ |
| `nome`  | string | 2–120 caracteres, `trim`                   |
| `email` | string | e-mail válido, normalizado para minúsculas |
| `senha` | string | 8–72 caracteres                            |

**Respostas**

| Status | Corpo                                                              |
| ------ | ------------------------------------------------------------------ |
| `201`  | `{ "usuario": UsuarioPublico }`                                    |
| `409`  | `{ "error": "Já existe um usuário cadastrado com este e-mail." }`  |
| `422`  | `{ "error": "Dados inválidos na requisição.", "detalhes": [...] }` |

---

### `POST /auth/login` — público (rate limit: 10 tentativas / 15 min por IP)

**Request**

```json
{ "email": "maria@escola.com", "senha": "senhaSegura123" }
```

**Respostas**

| Status | Corpo                                                                           |
| ------ | ------------------------------------------------------------------------------- |
| `200`  | `{ "token": "<jwt>", "usuario": UsuarioPublico }`                               |
| `401`  | `{ "error": "E-mail ou senha inválidos." }`                                     |
| `403`  | `{ "error": "Usuário desativado. Procure um professor responsável." }`          |
| `422`  | `{ "error": "Dados inválidos na requisição.", "detalhes": [...] }`              |
| `429`  | `{ "error": "Muitas tentativas de login. Tente novamente em alguns minutos." }` |

---

### `GET /auth/me` — Bearer

**Respostas**

| Status | Corpo                                                 |
| ------ | ----------------------------------------------------- |
| `200`  | `{ "usuario": UsuarioPublico }`                       |
| `401`  | token ausente, inválido, expirado ou usuário removido |
| `403`  | `{ "error": "Usuário desativado." }`                  |

---

## 3. Posts

### `GET /posts` — público

Lista todos os posts, ordenados por `criadoEm` decrescente. **Sem paginação.**

| Status | Corpo    |
| ------ | -------- |
| `200`  | `Post[]` |

---

### `GET /posts/search?termo=<texto>` — público

Busca case-insensitive em `titulo` e `conteudo`. O termo é escapado (sem regex injection).

| Status | Corpo                                                        |
| ------ | ------------------------------------------------------------ |
| `200`  | `Post[]` (pode ser vazio)                                    |
| `400`  | `{ "error": "O parâmetro de busca 'termo' é obrigatório." }` |

O app deve usar `encodeURIComponent` no termo.

---

### `GET /posts/:id` — público

| Status | Corpo                                        |
| ------ | -------------------------------------------- |
| `200`  | `Post`                                       |
| `400`  | `{ "error": "Identificador inválido: id." }` |
| `404`  | `{ "error": "Postagem não encontrada." }`    |

---

### `POST /posts` — professor

**Request**

```json
{ "titulo": "Introdução ao Node.js", "conteudo": "Nesta aula veremos..." }
```

| Campo      | Tipo   | Regras                     |
| ---------- | ------ | -------------------------- |
| `titulo`   | string | 1–200 caracteres, `trim`   |
| `conteudo` | string | 1–20000 caracteres, `trim` |

`autor` e `autorId` são derivados do token; enviá-los no corpo não tem efeito.

| Status | Corpo                          |
| ------ | ------------------------------ |
| `201`  | `Post`                         |
| `401`  | token ausente/inválido         |
| `403`  | papel diferente de `professor` |
| `422`  | validação                      |

---

### `PUT /posts/:id` — professor

**Request** (ao menos um campo)

```json
{ "titulo": "Novo título", "conteudo": "Novo conteúdo" }
```

| Status        | Corpo                                                                             |
| ------------- | --------------------------------------------------------------------------------- |
| `200`         | `Post` atualizado                                                                 |
| `400`         | `{ "error": "Informe ao menos um campo para atualização (titulo ou conteudo)." }` |
| `400`         | identificador inválido                                                            |
| `401` / `403` | autenticação/autorização                                                          |
| `404`         | `{ "error": "Postagem não encontrada para edição." }`                             |
| `422`         | validação                                                                         |

---

### `DELETE /posts/:id` — professor

| Status        | Corpo                                                   |
| ------------- | ------------------------------------------------------- |
| `200`         | `{ "message": "Postagem excluída com sucesso!" }`       |
| `400`         | identificador inválido                                  |
| `401` / `403` | autenticação/autorização                                |
| `404`         | `{ "error": "Postagem não encontrada para exclusão." }` |

---

## 4. Usuários — todas as rotas exigem professor autenticado

### `GET /users?role=professor|aluno` — professor

`role` é opcional. Ordenação por `nome` crescente. **Sem paginação.**

| Status        | Corpo                    |
| ------------- | ------------------------ |
| `200`         | `UsuarioPublico[]`       |
| `401` / `403` | autenticação/autorização |
| `422`         | `role` inválido          |

---

### `GET /users/:id` — professor

| Status | Corpo                                    |
| ------ | ---------------------------------------- |
| `200`  | `UsuarioPublico`                         |
| `400`  | identificador inválido                   |
| `404`  | `{ "error": "Usuário não encontrado." }` |

---

### `POST /users` — professor

**Request**

```json
{ "nome": "João Aluno", "email": "joao@escola.com", "senha": "senhaSegura123", "role": "aluno" }
```

| Campo   | Tipo                     | Regras        |
| ------- | ------------------------ | ------------- |
| `nome`  | string                   | 2–120         |
| `email` | string                   | e-mail válido |
| `senha` | string                   | 8–72          |
| `role`  | `'professor' \| 'aluno'` | obrigatório   |

| Status | Corpo                |
| ------ | -------------------- |
| `201`  | `UsuarioPublico`     |
| `409`  | e-mail já cadastrado |
| `422`  | validação            |

---

### `PUT /users/:id` — professor

**Request** (todos opcionais)

```json
{
  "nome": "Novo nome",
  "email": "novo@escola.com",
  "senha": "novaSenha123",
  "role": "professor",
  "ativo": true
}
```

Regras de negócio:

- Professor não pode alterar o próprio `role` → `403`.
- Professor não pode se desativar (`ativo: false` em si mesmo) → `403`.
- E-mail em uso por outro usuário → `409`.

| Status | Corpo                    |
| ------ | ------------------------ |
| `200`  | `UsuarioPublico`         |
| `400`  | identificador inválido   |
| `403`  | regra de negócio violada |
| `404`  | usuário não encontrado   |
| `409`  | e-mail duplicado         |
| `422`  | validação                |

---

### `DELETE /users/:id` — professor (desativação lógica)

Não remove o documento; define `ativo: false`.

| Status | Corpo                                                                         |
| ------ | ----------------------------------------------------------------------------- |
| `200`  | `{ "message": "Usuário desativado com sucesso.", "usuario": UsuarioPublico }` |
| `400`  | identificador inválido                                                        |
| `403`  | tentativa de desativar o próprio usuário                                      |
| `404`  | usuário não encontrado                                                        |

---

## 5. Códigos HTTP consolidados

| Status | Significado no backend                                   |
| ------ | -------------------------------------------------------- |
| `200`  | sucesso em leitura/atualização/exclusão                  |
| `201`  | criação                                                  |
| `400`  | ID malformado, JSON inválido, campo obrigatório ausente  |
| `401`  | token ausente/inválido/expirado; credenciais inválidas   |
| `403`  | papel insuficiente; usuário desativado; regra de negócio |
| `404`  | recurso ou rota inexistente                              |
| `409`  | conflito (e-mail duplicado)                              |
| `422`  | falha de validação (com `detalhes`)                      |
| `429`  | rate limit no login                                      |
| `500`  | erro interno (sem detalhes)                              |

---

## 6. Observações para o app mobile

1. Tratar `401` limpando o token e redirecionando ao login.
2. Tratar `403` exibindo mensagem de permissão, sem expor detalhes internos.
3. Exibir `detalhes` de `422` associados aos campos do formulário.
4. Não enviar `autor` em `POST/PUT /posts`.
5. Não enviar `role` em `POST /auth/register`.
6. Rotular `DELETE /users/:id` como "Desativar" na interface.
7. Não implementar paginação — a API não oferece.
8. Não implementar comentários nem upload de imagens — não existem no backend.
