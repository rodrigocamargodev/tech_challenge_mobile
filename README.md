# 🚀 Blog de Giz — Aplicativo Mobile

### 🎓 FIAP - Full Stack Development

Aplicativo educacional **Blog de Giz**, desenvolvido em **React Native + Expo + TypeScript** e integrado à API REST do Blog de Giz.

> **FIAP — Tech Challenge | Fase 4 — React Native**
> Pós Tech Full Stack Development · Turma 9FSDT · Grupo 61

---

## 👥 Integrantes do Grupo 61

*   **Rodrigo Nose de Camargo**
    📧 [rodrigocamargo.dev@gmail.com](mailto:rodrigocamargo.dev@gmail.com)
    🔗 [GitHub Profile](https://github.com/rodrigocamargodev)

*   **Felipe de Oliveira de Souza**
    🔗 [GitHub Profile](https://github.com/felipedos)

---

## 📖 Descrição

O Blog de Giz é uma plataforma educacional em que **professores** publicam conteúdo de aula e **alunos** consomem esse material pelo celular.

O aplicativo é nativo (React Native), não uma aplicação web embarcada em WebView.

### Objetivo acadêmico

Demonstrar, em um projeto de escopo controlado, a construção de um app mobile completo: navegação, autenticação com JWT, consumo de API REST, design system próprio, acessibilidade, testes automatizados e documentação técnica.

---

## ✨ Funcionalidades

### Aluno

- Cadastro público (sempre cria o papel `aluno`).
- Login e restauração de sessão.
- Consulta e pesquisa de postagens.
- Leitura da postagem completa.

### Professor

- Login.
- Consulta e pesquisa de postagens.
- Criação, edição e exclusão de postagens.
- Gerenciamento de professores e alunos (listar, criar, editar, desativar).

> A autorização definitiva é sempre do backend. O app apenas reflete as permissões recebidas.

---

## 🛠️ Tecnologias

| Camada               | Tecnologia                                      |
| -------------------- | ----------------------------------------------- |
| Runtime mobile       | React Native 0.88                               |
| Plataforma           | Expo SDK 58                                     |
| Linguagem            | TypeScript (strict)                             |
| Navegação            | Expo Router (rotas por arquivo)                 |
| Dados remotos        | TanStack Query 5                                |
| Formulários          | React Hook Form + Zod                           |
| Armazenamento seguro | Expo SecureStore                                |
| Testes               | Jest + jest-expo + React Native Testing Library |
| Qualidade            | ESLint + Prettier                               |

---

## ✅ Pré-requisitos

| Ferramenta | Versão | Observação |
| ---------- | ------ | ---------- |
| Node.js | 20+ | `engines` do `package.json` |
| npm | 9+ | vem com o Node |
| Expo Go (opcional) | SDK 58 | para rodar em dispositivo físico |
| Backend do Blog de Giz | — | repositório separado (Node + Express + MongoDB) |

Para gerar um build Android instalável, é necessário **Java 17** e o **Android SDK** (ou uma conta Expo para o EAS Build). Veja a seção [Build Android](#-build-android).

---

## 📁 Estrutura do projeto

```text
tech_challenge_mobile/
├── app/                        # rotas (Expo Router)
│   ├── _layout.tsx             # providers globais + guarda de sessão
│   ├── (auth)/                 # grupo público
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   └── cadastro.tsx
│   └── (app)/                  # grupo autenticado
│       ├── _layout.tsx
│       ├── index.tsx           # home: listagem e busca de postagens
│       ├── posts/              # detalhe, criação e edição de postagens
│       └── usuarios/           # gestão de usuários (professor)
│           ├── index.tsx       # listagem + filtros
│           ├── novo.tsx        # cadastro
│           ├── [id].tsx        # detalhe + desativar/reativar
│           └── [id]/editar.tsx # edição
├── assets/                     # ícone, adaptive icon, splash e favicon
├── src/
│   ├── core/
│   │   ├── config/             # env.ts (EXPO_PUBLIC_API_URL)
│   │   ├── http/               # client.ts, ApiError.ts, authEvents.ts, queryClient.ts
│   │   ├── storage/            # secureTokenStorage.ts (SecureStore)
│   │   └── theme/              # tokens.ts (Lousa Moderna)
│   ├── features/
│   │   ├── auth/               # AuthContext, authService, schemas, access, RoleGuard
│   │   ├── posts/              # postsService, queries, schemas, componentes
│   │   └── users/              # usersService, queries, schemas, userErrors, componentes
│   ├── shared/
│   │   ├── components/         # Button, TextField, Banner, OptionGroup, ConfirmDialog…
│   │   ├── hooks/              # useDebounce
│   │   └── utils/              # formatarData
│   └── test/                   # setup.ts, helpers e testes de telas
├── docs/
│   ├── technical-audit.md      # auditoria da Fase 0
│   └── api-contracts.md        # contratos reais da API
├── .env.example
├── app.config.ts               # identidade visual, ícone, splash e permissões
├── eas.json                    # perfis de build Android (EAS)
├── eslint.config.js
├── jest.config.js
├── package.json
└── tsconfig.json
```

---

## 🔐 Autenticação (Fase 2)

Fluxo implementado:

1. **Login** (`POST /auth/login`) — o token JWT é salvo no **Expo SecureStore**.
2. **Cadastro público** (`POST /auth/register`) — cria **sempre** um aluno; o app
   não envia `role`. Após o cadastro, a sessão é aberta automaticamente com as
   mesmas credenciais.
3. **Restauração de sessão** — ao abrir o app, o token salvo é validado em
   `GET /auth/me`. Enquanto isso, apenas um estado de carregamento é exibido:
   nenhum conteúdo privado aparece antes da validação.
4. **Logout** — remove o token do SecureStore e limpa todo o cache privado do
   TanStack Query.
5. **Proteção de rotas** — `app/_layout.tsx` usa `Stack.Protected` para montar
   apenas o grupo compatível com o estado da sessão. Telas administrativas usam
   `RoleGuard area="professor"`.

### Tratamento de erros HTTP

| Status | Comportamento no app                                                       |
| ------ | -------------------------------------------------------------------------- |
| `401`  | Sessão encerrada de forma centralizada (evento em `core/http/authEvents`). |
| `403`  | Mensagem de permissão/conta desativada; a sessão não é confundida com 401. |
| `409`  | E-mail já cadastrado, associado ao campo `email`.                          |
| `422`  | `detalhes` do backend associados aos campos do formulário.                 |
| `429`  | Aviso para aguardar antes de tentar novamente (rate limit do login).       |

> O `401` só encerra a sessão quando a requisição enviou um token. Um `401` de
> credenciais inválidas no login (requisição anônima) não derruba outra sessão.

A autorização definitiva permanece no backend: o app apenas reflete o papel
recebido e nunca envia `role` para se autopromover.

---

## 🚀 Instalação

Pré-requisitos: **Node.js 20+** e **npm**.

```bash
npm install
```

---

## ⚙️ Configuração do ambiente

Copie o arquivo de exemplo e ajuste a URL da API:

```bash
cp .env.example .env
```

```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000
```

Apenas variáveis com prefixo `EXPO_PUBLIC_` são expostas ao bundle. **Nunca** coloque segredos, tokens ou senhas nesse arquivo.

### URL da API por ambiente

| Ambiente           | URL base                          |
| ------------------ | --------------------------------- |
| Emulador Android   | `http://10.0.2.2:3000`            |
| Simulador iOS      | `http://localhost:3000`           |
| Dispositivo físico | `http://<IP-da-sua-máquina>:3000` |
| Produção           | `https://api.seudominio.com`      |

> O `localhost` do emulador Android **não** é o da sua máquina: use `10.0.2.2`.
> Em dispositivo físico, celular e computador devem estar na mesma rede. Descubra o IP com `hostname -I` (Linux/macOS) ou `ipconfig` (Windows).

Se `EXPO_PUBLIC_API_URL` não for definida, o app usa `http://10.0.2.2:3000` como padrão (emulador Android). Defina a variável explicitamente para qualquer outro ambiente.

---

## ▶️ Inicialização

```bash
npm start          # inicia o servidor de desenvolvimento do Expo
npm run android    # abre no emulador/dispositivo Android
npm run ios        # abre no simulador iOS (macOS)
```

---

## � Build Android

O projeto usa **Continuous Native Generation (CNG)**: as pastas `android/` e `ios/`
não são versionadas e são geradas a partir do `app.config.ts`.

### Opção A — EAS Build (recomendado, não exige Android SDK local)

```bash
npm install -g eas-cli
eas login                 # conta Expo (gratuita)
eas build --platform android --profile preview     # gera um APK instalável
eas build --platform android --profile production  # gera um AAB para a Play Store
```

Os perfis estão definidos em `eas.json`:

| Perfil | Artefato | Uso |
| ------ | -------- | --- |
| `development` | APK (development client) | desenvolvimento com build nativo |
| `preview` | APK | instalação direta em dispositivo/emulador |
| `production` | AAB | publicação na Play Store |

### Opção B — Build local (exige Java 17 + Android SDK)

```bash
npx expo prebuild --platform android   # gera a pasta android/
cd android && ./gradlew assembleRelease   # APK em android/app/build/outputs/apk/
```

### Verificação sem build nativo

```bash
npx expo export --platform android   # gera o bundle JS (dist/) — NÃO é um APK
```

> `expo export` produz apenas o bundle JavaScript. Ele valida que o app compila e
> empacota, mas **não** gera um artefato instalável.

---

## �🔌 Conexão com o backend

O backend do Blog de Giz é um projeto separado (Node.js + Express + MongoDB).

```bash
# no repositório do backend
npm install
cp .env.example .env      # ajuste JWT_SECRET e MONGO_URI
npm run seed:professor    # cria o primeiro professor
npm run dev               # http://localhost:3000
```

Verifique a disponibilidade em `GET /health`.

Os contratos consumidos pelo app estão documentados em [`docs/api-contracts.md`](docs/api-contracts.md).

---

## 🧪 Testes

```bash
npm test               # executa a suíte
npm run test:coverage  # executa com relatório de cobertura
```

> Em máquinas com poucos núcleos, a instrumentação de cobertura pode estourar o
> timeout padrão de 5s por contenção de CPU. Nesse caso, reduza o paralelismo:
> `npx jest --coverage --maxWorkers=2`.

---

## 👥 Gerenciamento de usuários (Fase 4)

Área exclusiva de **professor**, acessível pela home ("Gerenciar usuários") ou
por `/usuarios`. Todas as rotas `/users` do backend exigem professor autenticado
e respondem `403` para alunos — a proteção de navegação (`RoleGuard`) é apenas
uma barreira de UX, não de segurança.

| Tela                    | Rota                     | Operação na API                          |
| ----------------------- | ------------------------ | ---------------------------------------- |
| Listagem + filtros      | `/usuarios`              | `GET /users?role=`                       |
| Detalhe                 | `/usuarios/:id`          | `GET /users/:id`                         |
| Cadastro                | `/usuarios/novo`         | `POST /users`                            |
| Edição                  | `/usuarios/:id/editar`   | `PUT /users/:id`                         |
| Desativar / Reativar    | `/usuarios/:id`          | `DELETE /users/:id` / `PUT` `{ativo:true}` |

Decisões relevantes:

- **Filtro por papel** é aplicado pelo backend (`?role=`), o único filtro
  suportado. O **filtro por texto** é local, sobre a lista já carregada — a API
  não oferece busca de usuários e a listagem não tem paginação, então filtrar no
  cliente não omite resultados.
- **Desativação é lógica** (`DELETE /users/:id` → `ativo: false`), sempre com
  confirmação e rotulada como "Desativar", nunca "Excluir".
- **Reativação** usa `PUT /users/:id` com `{ ativo: true }` — não existe rota
  dedicada no backend.
- **Regras de negócio do backend** são refletidas na interface: o próprio
  professor não vê a ação de desativar a si mesmo e tem o campo de papel travado
  ao editar a própria conta (o backend responde `403` nesses casos).
- **Cadastro público** (`POST /auth/register`) continua criando sempre aluno; a
  promoção a professor só é possível por um professor, via `POST/PUT /users`.

---

## 📜 Scripts disponíveis

| Script                  | Descrição                          |
| ----------------------- | ---------------------------------- |
| `npm start`             | Inicia o Expo                      |
| `npm run android`       | Inicia no Android                  |
| `npm run ios`           | Inicia no iOS                      |
| `npm test`              | Executa os testes                  |
| `npm run test:coverage` | Testes com cobertura               |
| `npm run lint`          | ESLint                             |
| `npm run typecheck`     | Checagem de tipos (`tsc --noEmit`) |
| `npm run verify`        | `typecheck` + `lint` + `test`      |

---

## 🎨 Design System — Lousa Moderna

Tokens centralizados em `src/core/theme/tokens.ts`.

| Token              | Cor       | Aplicação             |
| ------------------ | --------- | --------------------- |
| `chalkboard`       | `#1A2E26` | Fundo institucional   |
| `chalkboardRaised` | `#233D33` | Superfícies escuras   |
| `chalkWhite`       | `#F7F9F6` | Texto em fundo escuro |
| `paper`            | `#F4F5F0` | Fundo de leitura      |
| `surface`          | `#FFFFFF` | Cards e formulários   |
| `ink`              | `#18231E` | Texto principal       |
| `mutedInk`         | `#53635B` | Texto secundário      |
| `chalkYellow`      | `#F4D068` | Ações principais      |
| `chalkBlue`        | `#A4C3D2` | Tags e informações    |
| `chalkCoral`       | `#FF9F9F` | Erros e exclusões     |
| `border`           | `#D9E0DA` | Bordas                |

Feedback de ações usa o componente `Banner`:

| Variante  | Cor                 | Uso                          |
| --------- | ------------------- | ---------------------------- |
| `error`   | `chalkCoral`        | Falhas (anunciado como alerta) |
| `info`    | `chalkBlue`         | Informação neutra            |
| `success` | `chalkboardRaised`  | Confirmação de ação concluída |

### Identidade visual

| Asset | Arquivo | Descrição |
| ----- | ------- | --------- |
| Ícone do app | `assets/icon.png` | Giz amarelo escrevendo sobre a lousa verde |
| Adaptive icon (Android) | `assets/adaptive-icon.png` | Marca na zona segura, fundo `#1A2E26` |
| Splash | `assets/splash-icon.png` | Marca centralizada sobre `#1A2E26` |
| Favicon (web) | `assets/favicon.png` | Versão reduzida do ícone |

O conceito é um **giz amarelo (`#F4D068`) escrevendo uma linha clara (`#F7F9F6`)
sobre a lousa verde (`#1A2E26`)** — simples, memorável e coerente com a proposta
de lousa moderna. Os assets são referenciados em `app.config.ts`.

A marca também aparece no layout, via o componente `BrandMark`:

| Local | Tamanho | Observação |
| ----- | ------- | ---------- |
| Login e cadastro | 72pt | Bloco de marca (primeiro contato) |
| Cabeçalho da home | 40pt | `ScreenHeader` com `showBrand` |

A imagem é **decorativa** para leitores de tela (o nome do app já é anunciado
pelo título ao lado), evitando anúncio duplicado no TalkBack/VoiceOver.

---

## ⚠️ Limitações conhecidas

- **Sem paginação** em `GET /posts` e `GET /users` — a API retorna a coleção completa.
- **Sem busca de usuários na API** — o filtro por nome/e-mail na gestão de usuários é local, sobre a lista completa já carregada.
- **Sem refresh token** — o JWT expira em 8h; ao receber `401`, a sessão é encerrada.
- **Sem comentários** e **sem upload de imagens** — não existem no backend e não são simulados.
- **`DELETE /users/:id` é desativação lógica** (`ativo: false`), apresentada na interface como "Desativar usuário".
- Alunos não têm acesso à gestão de usuários (restrita a professores pelo backend).
- **Validação em dispositivo físico/emulador pendente** — os fluxos foram validados no preview do Expo contra o backend real; instruções em [`FASE_6_RELATORIO.md`](FASE_6_RELATORIO.md).
- **APK/AAB não gerado neste ambiente** — sem Java/Android SDK e sem conta EAS. O bundle Android foi exportado com sucesso; os comandos para gerar o artefato estão na seção [Build Android](#-build-android).

---

## 📚 Documentação técnica

- [`docs/api-contracts.md`](docs/api-contracts.md) — contratos reais da API.
