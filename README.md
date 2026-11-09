# StudyBoard

Plataforma de **chat + organização de tarefas** para grupos de estudo. As conversas ficam em **MongoDB (NoSQL)** e chegam em tempo real aos participantes.

## Documentação e acompanhamento
- [PRD — Product Requirements Document](docs/PRD.md)
- [GitHub Project](https://github.com/users/kauecavalcante/projects/5)

## Funcionalidades
- Cadastro e login (JWT)
- Grupos com código de convite e convite por e-mail
- Chat do grupo em tempo real, com histórico paginado
- Conversa direta (1:1) entre membros de um mesmo grupo
- Quadro de tarefas (A fazer, Em andamento, Concluído) com responsável, prazo e prioridade
- Criar uma tarefa a partir de uma mensagem do chat

## Como executar (Docker Compose)

Requisito: [Docker](https://www.docker.com/) com Docker Compose.

```bash
git clone https://github.com/kauecavalcante/studyboard.git
cd studyboard
docker compose up --build
```

Acesse **http://localhost:3000**.

Para trocar a porta ou o segredo do JWT, copie `.env.example` para `.env` e edite. Para parar e apagar os dados:

```bash
docker compose down -v
```

### Testando com duas pessoas
1. Crie uma conta e um grupo na janela normal do navegador.
2. Copie o código de convite na aba **Membros**.
3. Em uma janela anônima, crie outra conta e use o ícone 🔑 para entrar com o código.
4. Converse nos dois lados e veja as mensagens chegando em tempo real.

## Estrutura

```
api/    API REST + Socket.IO (Node.js, Express, MongoDB)
web/    Interface (React + Vite), servida por Nginx no Docker
docs/   PRD
```

## Modelo de dados (MongoDB)

| Coleção | Conteúdo |
|---|---|
| `users` | nome, e-mail, hash da senha |
| `groups` | nome, código de convite, membros e papéis |
| `conversations` | tipo (`group` ou `direct`), participantes, última mensagem |
| `messages` | uma mensagem por documento, ligada à conversa |
| `tasks` | tarefas do quadro, opcionalmente ligadas a uma mensagem |

Detalhes, exemplos de documentos e índices estão na seção 5 do [PRD](docs/PRD.md).

## API

| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/auth/register` · `/api/auth/login` | Cadastro e login |
| GET | `/api/auth/me` | Usuário autenticado |
| GET/POST | `/api/groups` | Listar e criar grupos |
| POST | `/api/groups/join` | Entrar com código de convite |
| GET | `/api/groups/:id` | Detalhes e membros |
| POST | `/api/groups/:id/members` | Adicionar membro por e-mail (admin) |
| DELETE | `/api/groups/:id/members/:userId` | Remover membro (admin) |
| GET | `/api/conversations` | Conversas do usuário |
| POST | `/api/conversations/direct` | Abrir conversa direta |
| GET | `/api/conversations/:id/messages?before=&limit=` | Histórico paginado |
| POST | `/api/conversations/:id/messages` | Enviar mensagem |
| GET/POST | `/api/groups/:id/tasks` | Listar e criar tarefas |
| PATCH/DELETE | `/api/tasks/:id` | Atualizar, mover e excluir tarefa |

Tempo real (Socket.IO, autenticado por token): o cliente emite `message:send` e recebe `message:new` e `task:changed`.

## Desenvolvimento e testes

Requisitos: Node.js 22+ e um MongoDB acessível.

```bash
docker run -d --name studyboard-test-db -p 27018:27017 mongo:7

cd api
npm install
MONGO_URL=mongodb://127.0.0.1:27018 npm test      # testes de integração

MONGO_URL=mongodb://127.0.0.1:27018 npm run dev   # API em :3001
cd ../web && npm install && npm run dev            # interface em :5173
```

Os testes cobrem os critérios de aceitação do PRD (envio, tempo real, ordenação, paginação, persistência e regras de acesso).

## Autor
Kauê Cavalcante Wanderley de Melo — [@kauecavalcante](https://github.com/kauecavalcante)
