# PRD — StudyBoard

> Product Requirements Document · Versão 1.0 · 09/11/2026
> Plataforma de **chat + organização de tarefas** para grupos de estudo.

---

## 1. Visão do produto

### 1.1 Nome
**StudyBoard**

### 1.2 Problema identificado
Grupos de estudo e de trabalhos acadêmicos se organizam de forma fragmentada: a conversa acontece no WhatsApp, as tarefas ficam em planilhas ou na memória de alguém, e os arquivos/links se perdem no meio das mensagens. Consequências:

- Ninguém sabe ao certo **quem ficou responsável por quê** e **até quando**.
- Decisões tomadas no chat não viram tarefas e acabam esquecidas.
- Mensagens importantes são difíceis de encontrar depois.
- Alunos novos no grupo não têm acesso fácil ao histórico.

### 1.3 Público-alvo
- **Primário:** estudantes universitários que fazem trabalhos em grupo (3 a 8 pessoas).
- **Secundário:** professores/monitores que acompanham o andamento dos grupos (fora do MVP, ver seção 2.3).

### 1.4 Objetivos
1. Reunir **conversa e organização de tarefas** no mesmo lugar.
2. Permitir que o grupo converse em tempo real com **histórico persistente**.
3. Dar visibilidade clara de responsáveis, prazos e status das tarefas.
4. Entregar um MVP funcional, publicado e testável até **16/11/2026**.

### 1.5 Benefícios esperados
- Menos ruído e menos retrabalho na comunicação do grupo.
- Responsabilidades e prazos visíveis para todos.
- Histórico de decisões consultável a qualquer momento.
- Redução de tarefas esquecidas ou duplicadas.

### 1.6 Métricas de sucesso (MVP)
| Métrica | Meta |
|---|---|
| Tempo para enviar e ver a mensagem entregue | ≤ 1 s em condições normais |
| Usuário consegue criar grupo e enviar a 1ª mensagem | ≤ 2 min |
| Tarefas criadas e movidas de status em um teste de uso | 100% dos fluxos principais funcionando |

---

## 2. Escopo

### 2.1 Funcionalidades previstas (visão completa)
- Cadastro e login de usuários
- Criação de grupos e convite de membros
- **Chat em grupo e conversa direta (1:1)** com histórico
- Quadro de tarefas (Kanban: A fazer / Em andamento / Concluído)
- Atribuição de responsável e prazo nas tarefas
- Transformar uma mensagem do chat em tarefa
- Anexos de arquivos e links
- Notificações (push/e-mail)
- Busca no histórico de mensagens
- Painel para professor acompanhar grupos
- Indicador de "digitando…" e confirmação de leitura

### 2.2 MVP (primeira versão)
O MVP contém **somente** o necessário para validar a ideia:

| # | Funcionalidade |
|---|---|
| 1 | Cadastro e login (e-mail + senha) |
| 2 | Criar grupo e adicionar membros por e-mail/código de convite |
| 3 | Chat em grupo em tempo real com histórico paginado |
| 4 | Conversa direta (1:1) entre dois usuários |
| 5 | Quadro de tarefas com 3 colunas, responsável, prazo e prioridade |
| 6 | Criar tarefa a partir de uma mensagem do chat |
| 7 | Publicação (deploy) da aplicação ou execução local documentada |

### 2.3 Fora do escopo do MVP
- Notificações push/e-mail
- Anexos de arquivos (apenas texto e links no MVP)
- Busca textual avançada
- Painel do professor
- Confirmação de leitura e "digitando…"
- Edição/exclusão de mensagens
- Aplicativo mobile nativo (a web será responsiva)
- Chamadas de voz/vídeo

---

## 3. Requisitos

### 3.1 Requisitos funcionais

| ID | Requisito | Prioridade |
|---|---|---|
| RF01 | O sistema deve permitir cadastro com nome, e-mail e senha. | Alta |
| RF02 | O sistema deve permitir login e logout. | Alta |
| RF03 | O usuário autenticado deve poder criar um grupo com nome e descrição. | Alta |
| RF04 | O criador do grupo (admin) deve poder convidar membros por e-mail ou código de convite. | Alta |
| RF05 | Membros do grupo devem poder enviar mensagens de texto no chat do grupo. | Alta |
| RF06 | Mensagens devem ser exibidas em tempo real para os demais membros online. | Alta |
| RF07 | Usuários devem poder iniciar uma conversa direta com outro usuário que compartilhe um grupo com ele. | Média |
| RF08 | O histórico de mensagens deve ser consultável, ordenado cronologicamente e paginado. | Alta |
| RF09 | O grupo deve possuir um quadro de tarefas com colunas A fazer, Em andamento e Concluído. | Alta |
| RF10 | Tarefas devem ter título, descrição, responsável, prazo e prioridade. | Alta |
| RF11 | Membros devem poder mover tarefas entre colunas. | Alta |
| RF12 | O usuário deve poder criar uma tarefa a partir de uma mensagem do chat. | Média |
| RF13 | O usuário deve poder listar os grupos e conversas dos quais participa. | Alta |
| RF14 | Admin do grupo deve poder remover membros. | Baixa |

### 3.2 Requisitos não funcionais

| ID | Requisito |
|---|---|
| RNF01 | **Desempenho:** mensagens entregues aos membros online em até 1 s; carregamento de 50 mensagens em até 500 ms. |
| RNF02 | **Segurança:** senhas armazenadas com hash (bcrypt); autenticação por token JWT; todas as rotas de dados exigem autenticação. |
| RNF03 | **Autorização:** nenhum usuário acessa conversas ou tarefas de grupos dos quais não é membro. |
| RNF04 | **Usabilidade:** interface responsiva (celular e desktop). |
| RNF05 | **Disponibilidade:** aplicação publicada ou executável localmente com `README` de instalação. |
| RNF06 | **Manutenibilidade:** código versionado no GitHub, com variáveis sensíveis em `.env` (nunca no repositório). |
| RNF07 | **Escalabilidade:** modelo de dados de mensagens deve suportar crescimento do histórico sem degradar a consulta (índices e paginação). |
| RNF08 | **Privacidade/LGPD:** coletar apenas nome e e-mail; usuário pode solicitar exclusão da conta. |

### 3.3 Histórias de usuário e critérios de aceitação

#### HU01 — Cadastro e login
*Como estudante, quero criar uma conta e entrar no sistema para participar dos meus grupos.*

Critérios de aceitação:
- **Dado** um e-mail ainda não cadastrado, **quando** envio nome, e-mail e senha válidos, **então** a conta é criada e sou autenticado.
- **Dado** um e-mail já cadastrado, **quando** tento me cadastrar, **então** vejo a mensagem "e-mail já cadastrado" e nenhuma conta é criada.
- **Dado** credenciais incorretas, **quando** tento login, **então** o acesso é negado sem revelar qual campo está errado.
- A senha nunca é retornada em nenhuma resposta da API.

#### HU02 — Criar grupo e convidar membros
*Como estudante, quero criar um grupo e convidar colegas para organizar nosso trabalho.*

- **Dado** que estou logado, **quando** crio um grupo com nome, **então** ele aparece na minha lista e eu sou o admin.
- **Quando** o admin gera um código de convite, **então** qualquer usuário logado que o informe entra no grupo como membro.
- Um código de convite inválido ou expirado retorna erro e não adiciona ninguém.

#### HU03 — Conversar no grupo
*Como membro, quero enviar mensagens ao grupo para alinhar o trabalho com todos.*

- **Dado** que sou membro do grupo, **quando** envio uma mensagem não vazia, **então** ela é salva e aparece para todos os membros online em até 1 s.
- Mensagens vazias ou com mais de 2.000 caracteres são rejeitadas com erro de validação.
- **Dado** que **não** sou membro do grupo, **quando** tento enviar/ler mensagens, **então** recebo erro 403.
- Cada mensagem exibe autor, texto e data/hora de envio.

#### HU04 — Consultar histórico
*Como membro, quero ver mensagens antigas para recuperar decisões anteriores.*

- **Quando** abro uma conversa, **então** vejo as 50 mensagens mais recentes, exibidas da mais antiga para a mais nova.
- **Quando** rolo até o topo, **então** são carregadas as 50 mensagens anteriores, sem repetir nem pular mensagens.
- Mensagens enviadas antes de eu entrar no grupo **são** visíveis (política definida na seção 5.4).

#### HU05 — Conversa direta
*Como estudante, quero falar em particular com um colega do grupo.*

- **Dado** que compartilho um grupo com o usuário B, **quando** inicio uma conversa direta, **então** é criada (ou reaproveitada, se já existir) uma única conversa entre A e B.
- Somente A e B conseguem ler essa conversa.

#### HU06 — Quadro de tarefas
*Como membro, quero cadastrar tarefas com responsável e prazo para saber quem faz o quê.*

- **Quando** crio uma tarefa com título, **então** ela aparece na coluna "A fazer".
- Posso definir responsável (membro do grupo), prazo e prioridade (alta/média/baixa).
- **Quando** movo a tarefa para outra coluna, **então** o novo status é salvo e visto por todos.
- Tarefas com prazo vencido e não concluídas são destacadas visualmente.

#### HU07 — Mensagem vira tarefa
*Como membro, quero transformar uma mensagem em tarefa para não perder decisões do chat.*

- **Quando** escolho "Criar tarefa" em uma mensagem, **então** o título é pré-preenchido com o texto da mensagem e a tarefa guarda a referência (`sourceMessageId`) à mensagem original.

---

## 4. Gerência do projeto

### 4.1 Integrantes e responsabilidades

Projeto individual.

| Integrante | GitHub | Papel | Responsabilidades |
|---|---|---|---|
| Kauê Cavalcante Wanderley de Melo | [@kauecavalcante](https://github.com/kauecavalcante) | Desenvolvedor full stack e gestor do projeto | Produto e PRD, back-end, banco NoSQL, front-end, testes, deploy e documentação |

### 4.2 Stack tecnológica
- **Frontend:** React + Vite (ou Next.js)
- **Backend:** Node.js + Express + Socket.IO (tempo real)
- **Banco de dados:** MongoDB (Atlas para produção, local para desenvolvimento)
- **Autenticação:** JWT + bcrypt
- **Execução:** local via Docker Compose (MongoDB, API e front sobem com um único comando; instruções no README)
- **Versionamento e gestão:** GitHub + GitHub Projects

### 4.3 Backlog priorizado

| # | Item | Prioridade | Estimativa | Dependência |
|---|---|---|---|---|
| 1 | Configurar repositório, estrutura do projeto e CI básico | Alta | 2 h | — |
| 2 | Modelagem e conexão com MongoDB | Alta | 3 h | 1 |
| 3 | Cadastro e login (RF01, RF02) | Alta | 4 h | 2 |
| 4 | Criar grupo e convite (RF03, RF04) | Alta | 4 h | 3 |
| 5 | API de mensagens: enviar e consultar (RF05, RF08) | Alta | 5 h | 4 |
| 6 | Tempo real com Socket.IO (RF06) | Alta | 4 h | 5 |
| 7 | Tela de chat com histórico paginado | Alta | 6 h | 5 |
| 8 | Quadro de tarefas — API (RF09–RF11) | Alta | 5 h | 4 |
| 9 | Quadro de tarefas — interface | Alta | 6 h | 8 |
| 10 | Conversa direta 1:1 (RF07) | Média | 4 h | 5 |
| 11 | Mensagem → tarefa (RF12) | Média | 3 h | 5, 8 |
| 12 | Testes das regras de acesso e critérios de aceitação | Alta | 4 h | 5, 8 |
| 13 | Deploy / documentação de execução local | Alta | 3 h | todos |
| 14 | Remover membros (RF14) | Baixa | 2 h | 4 |

### 4.4 Etapas e prazos

| Etapa | Período | Entregável |
|---|---|---|
| 1. Planejamento | 09/11 – 10/11 | PRD, repositório e GitHub Project publicados |
| 2. Fundação | 10/11 – 11/11 | Repositório estruturado, banco, autenticação |
| 3. Núcleo do chat | 11/11 – 13/11 | Grupos, mensagens, tempo real, histórico |
| 4. Organização | 13/11 – 14/11 | Quadro de tarefas, mensagem → tarefa, conversa direta |
| 5. Testes e deploy | 14/11 – 15/11 | Testes, correções, publicação |
| 6. Entrega final | 15/11 – 16/11 (até 06:00) | Link do repositório com a configuração local enviado na plataforma |

### 4.5 Dependências
- Conta MongoDB Atlas (camada gratuita) criada e acessível por todos.
- Contas gratuitas em serviços de deploy (Render/Vercel).
- Back-end da API concluído antes das telas de chat e tarefas serem integradas.

### 4.6 Riscos e mitigação

| Risco | Prob. | Impacto | Mitigação |
|---|---|---|---|
| Prazo curto para o escopo | Alta | Alto | MVP enxuto; itens de prioridade baixa cortados primeiro |
| Dificuldade com tempo real (WebSocket) | Média | Alto | Fallback: *polling* a cada poucos segundos mantendo a mesma API |
| Falha no deploy | Média | Alto | Antecipar deploy para 14/11; plano B: execução local documentada com Docker |
| Regressões sem revisão externa | Média | Médio | Branches por funcionalidade, Pull Requests pequenos e testes automatizados nas regras de acesso |
| Imprevistos pessoais ou doença | Média | Alto | Margem de um dia no cronograma; itens de baixa prioridade são cortados primeiro |
| Vazamento de credenciais | Baixa | Alto | `.env` no `.gitignore`; segredos só nas variáveis do serviço de deploy |

### 4.7 Acompanhamento do andamento
- **GitHub Project público** com colunas *A fazer*, *Em andamento* e *Concluído*; toda atividade é uma issue com responsável, prioridade (alta/média/baixa) e milestone.
- **Revisão diária** de 10 min: o que foi feito, o que será feito e impedimentos, registrada em comentário na issue ativa.
- **Pull Requests** referenciando a issue (`Closes #N`) e com autorrevisão do diff antes do merge.
- **Definition of Done:** funcionalidade implementada, critérios de aceitação atendidos, revisada via PR (autorrevisão) e issue movida para *Concluído*.
- Revisão do backlog e dos riscos a cada fim de etapa.

---

## 5. Funcionalidade de conversa com NoSQL

### 5.1 Quem poderá conversar
- **Chat de grupo:** todos os membros de um grupo conversam entre si.
- **Conversa direta (1:1):** dois usuários que compartilhem ao menos um grupo.
- Usuários não autenticados ou fora do grupo **não** podem ler nem enviar mensagens.

### 5.2 Como as conversas são iniciadas
- **Grupo:** ao criar um grupo, uma conversa do tipo `group` é criada automaticamente e vinculada a ele.
- **Direta:** ao clicar em "Conversar" no perfil de um colega, o sistema busca uma conversa `direct` existente entre os dois; se não houver, cria uma. Para garantir unicidade, usa-se uma chave `directKey` = `idMenor_idMaior` com índice único.

### 5.3 Como as mensagens são enviadas, consultadas e armazenadas
- **Envio:** o cliente emite o evento `message:send` (Socket.IO) ou chama `POST /conversations/:id/messages`. O servidor valida o token, confirma que o usuário é participante, valida o conteúdo, grava a mensagem no MongoDB e a retransmite aos participantes conectados na sala da conversa.
- **Consulta:** `GET /conversations/:id/messages?limit=50&before=<cursor>` retorna as mensagens mais recentes e usa o cursor (`createdAt` + `_id` da mensagem mais antiga já carregada) para paginação.
- **Armazenamento:** cada mensagem é um documento na coleção `messages`. O campo `lastMessage` da conversa é atualizado a cada envio para listar conversas rapidamente.

### 5.4 Banco NoSQL escolhido e justificativa

**Escolha: MongoDB** (banco de documentos).

| Motivo | Explicação |
|---|---|
| Natureza dos dados | Mensagens são documentos independentes, de estrutura simples, que combinam bem com o formato JSON. |
| Escrita intensiva | Chat gera muitas inserções; o MongoDB lida bem com esse perfil. |
| Esquema flexível | Permite evoluir (anexos, reações, leitura) sem migrações custosas. |
| Consultas por intervalo | Índice composto `(conversationId, createdAt)` torna a paginação por cursor eficiente. |
| Ecossistema | Driver/Mongoose maduros para Node.js e camada gratuita no Atlas. |
| Alternativas descartadas | **Cassandra:** excelente para escala massiva, mas complexa demais para o MVP. **Firestore:** simples, porém com vínculo ao ecossistema Google e menor controle sobre consultas. **Redis:** rápido, mas voltado a cache/filas, não a histórico durável. |

### 5.5 Organização dos dados

Três coleções principais: `users`, `conversations` e `messages`. As mensagens ficam em **coleção própria** (e não embutidas na conversa) para evitar que o documento da conversa cresça indefinidamente (limite de 16 MB do MongoDB).

#### Coleção `users`
```json
{
  "_id": "ObjectId('665f1a...01')",
  "name": "Ana Souza",
  "email": "ana@exemplo.com",
  "passwordHash": "$2b$10$...",
  "createdAt": "2026-11-10T14:00:00Z"
}
```

#### Coleção `conversations`
```json
{
  "_id": "ObjectId('665f1b...10')",
  "type": "group",
  "groupId": "ObjectId('665f1a...aa')",
  "directKey": null,
  "participants": [
    { "userId": "ObjectId('665f1a...01')", "role": "admin",  "joinedAt": "2026-11-10T14:05:00Z" },
    { "userId": "ObjectId('665f1a...02')", "role": "member", "joinedAt": "2026-11-10T14:20:00Z" }
  ],
  "lastMessage": {
    "text": "Fechamos a entrega para sexta?",
    "senderId": "ObjectId('665f1a...02')",
    "createdAt": "2026-11-11T09:30:00Z"
  },
  "createdAt": "2026-11-10T14:05:00Z"
}
```

Exemplo de conversa direta:
```json
{
  "_id": "ObjectId('665f1b...11')",
  "type": "direct",
  "groupId": null,
  "directKey": "665f1a...01_665f1a...02",
  "participants": [
    { "userId": "ObjectId('665f1a...01')", "role": "member", "joinedAt": "2026-11-11T10:00:00Z" },
    { "userId": "ObjectId('665f1a...02')", "role": "member", "joinedAt": "2026-11-11T10:00:00Z" }
  ]
}
```

#### Coleção `messages`
```json
{
  "_id": "ObjectId('665f1c...100')",
  "conversationId": "ObjectId('665f1b...10')",
  "senderId": "ObjectId('665f1a...02')",
  "senderName": "Bruno Lima",
  "text": "Fechamos a entrega para sexta?",
  "type": "text",
  "createdAt": "2026-11-11T09:30:00Z"
}
```
> `senderName` é denormalizado de propósito: evita *join* a cada leitura do histórico.

#### Coleção `tasks` (organização)
```json
{
  "_id": "ObjectId('665f1d...200')",
  "groupId": "ObjectId('665f1a...aa')",
  "title": "Escrever introdução do relatório",
  "description": "",
  "status": "todo",
  "priority": "high",
  "assigneeId": "ObjectId('665f1a...02')",
  "dueDate": "2026-11-13T23:59:00Z",
  "sourceMessageId": "ObjectId('665f1c...100')",
  "createdBy": "ObjectId('665f1a...01')",
  "createdAt": "2026-11-11T09:35:00Z"
}
```

#### Índices
| Coleção | Índice | Finalidade |
|---|---|---|
| `users` | `{ email: 1 }` único | Login e unicidade |
| `conversations` | `{ "participants.userId": 1 }` | Listar conversas do usuário |
| `conversations` | `{ directKey: 1 }` único (parcial, só `direct`) | Evitar conversa direta duplicada |
| `messages` | `{ conversationId: 1, createdAt: -1, _id: -1 }` | Histórico ordenado e paginação por cursor |
| `tasks` | `{ groupId: 1, status: 1 }` | Montar o quadro do grupo |

### 5.6 Regras de acesso às conversas e ao histórico

1. Todas as requisições e conexões de socket exigem **token JWT válido**.
2. Só pode **ler ou enviar** mensagens quem estiver em `conversations.participants` da conversa.
3. O histórico completo da conversa é visível a todo participante, **inclusive mensagens anteriores à sua entrada** (decisão para facilitar a integração de novos membros).
4. Ao ser **removido** do grupo, o usuário perde imediatamente o acesso à conversa e ao histórico.
5. Conversas diretas só são visíveis aos dois participantes; nem o admin do grupo as acessa.
6. Mensagens **não podem ser editadas ou apagadas** no MVP (garante integridade do histórico).
7. O `senderId` é sempre obtido do token, **nunca** do corpo da requisição.
8. Validação: texto obrigatório, com no máximo 2.000 caracteres, sanitizado contra injeção de HTML.

### 5.7 Critérios de aceitação da funcionalidade de conversa

| ID | Critério | Como verificar |
|---|---|---|
| CA01 | **Envio:** participante envia mensagem válida e o documento é gravado em `messages` com `conversationId`, `senderId`, `text` e `createdAt`. | Enviar mensagem e consultar o banco. |
| CA02 | **Tempo real:** os demais participantes online recebem a mensagem em até 1 s sem recarregar a página. | Dois navegadores logados em contas diferentes. |
| CA03 | **Consulta:** ao abrir a conversa, são retornadas as 50 mensagens mais recentes. | Criar 120 mensagens e abrir a conversa → 50 retornadas. |
| CA04 | **Ordenação:** as mensagens são exibidas em ordem cronológica crescente (mais antiga → mais nova); em empate de `createdAt`, desempata por `_id`. | Conferir ordem na tela e na resposta da API. |
| CA05 | **Paginação:** carregar mensagens anteriores traz as 50 seguintes sem duplicar nem omitir nenhuma. | Paginar as 120 mensagens e verificar 120 únicas. |
| CA06 | **Persistência:** após recarregar a página ou reiniciar o servidor, o histórico continua disponível. | Recarregar e reiniciar a API. |
| CA07 | **Acesso negado:** usuário não participante recebe 403 ao ler ou enviar mensagens. | Requisição com token de outro usuário. |
| CA08 | **Sem token:** requisição sem JWT recebe 401. | Requisição sem cabeçalho de autorização. |
| CA09 | **Validação:** mensagem vazia ou acima de 2.000 caracteres é rejeitada com erro 400 e nada é gravado. | Enviar payloads inválidos. |
| CA10 | **Conversa direta única:** iniciar conversa A↔B duas vezes (ou B↔A) retorna sempre a mesma conversa. | Chamar o endpoint repetidamente. |
| CA11 | **Remoção de membro:** após ser removido, o usuário recebe 403 ao tentar acessar o chat do grupo. | Remover membro e tentar ler. |

---

## 6. Glossário
- **PRD:** Product Requirements Document.
- **MVP:** Produto Mínimo Viável.
- **NoSQL:** bancos de dados não relacionais.
- **JWT:** JSON Web Token, usado para autenticação.
- **Paginação por cursor:** técnica que usa a posição da última mensagem carregada para buscar a próxima página.
