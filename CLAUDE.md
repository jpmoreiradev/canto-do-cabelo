# Canto do Cabelo — Sistema de Fila de Espera

Sistema de ordem de chegada para barbearia/salão. Clientes acompanham sua posição pelo celular, a TV exibe a fila em tempo real, e o atendente gerencia tudo por um painel protegido por senha.

## Stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS v4**
- **Prisma 5** + **PostgreSQL no Neon** (serverless, sa-east-1)
- **jose** — JWT para autenticação do admin
- Tema 100% escuro (zinc-950/900/800)

## Como rodar

```bash
npm run dev        # dev em http://localhost:3000
npm run build      # build de produção
npm start          # produção
```

## Variáveis de ambiente (.env.local)

```
DATABASE_URL="postgresql://neondb_owner:...@...neon.tech/neondb?sslmode=require"
ADMIN_PASSWORD="canto123"          # senha do dono para acessar /admin
JWT_SECRET="..."                   # chave secreta do cookie de sessão
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

O `.env` é uma cópia do `.env.local` necessária para o CLI do Prisma funcionar.

## Páginas

| Rota | Quem usa | Descrição |
|---|---|---|
| `/` | — | Redireciona para `/tv` |
| `/tv` | TV do salão | Fila em tempo real (polling 3s), tela cheia dark |
| `/admin` | Dono | Adicionar pacientes, chamar próximo, concluir — requer login |
| `/admin/login` | Dono | Login com senha (cookie JWT 12h) |
| `/acompanhar?id=UUID` | Cliente | Cliente vê sua posição em tempo real (polling 3s) |

## Fluxo de uso

1. Cliente chega → admin acessa `/admin` e adiciona o nome
2. Sistema gera ticket sequencial e exibe o link de acompanhamento
3. Admin copia o link e manda pro cliente (WhatsApp etc.)
4. Cliente abre o link no celular e acompanha sua posição
5. Admin clica "Chamar Próximo" → TV atualiza, cliente vê "É a sua vez!"
6. Admin clica "Concluir" → cliente marcado como atendido

## Proteção do admin

- Middleware (`middleware.ts`) bloqueia `/admin/*` e `POST /api/queue*` sem sessão válida
- Login via `POST /api/auth/login` com `{ password }` → seta cookie `session` (httpOnly, 12h)
- Logout via `POST /api/auth/logout` → apaga o cookie
- Senha configurada em `ADMIN_PASSWORD` no `.env.local`

## Banco de dados (Prisma + Neon)

### Schema (`prisma/schema.prisma`)

```prisma
model QueueEntry {
  id        String      @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name      String      @db.VarChar(100)
  ticket    Int
  status    EntryStatus @default(waiting)   // waiting | called | served
  createdAt DateTime    @default(now())
  calledAt  DateTime?
}

model QueueConfig {
  key   String  @id   // "current_ticket" | "last_called_id"
  value String?
}

enum EntryStatus { waiting called served }
```

### Comandos Prisma

```bash
npx prisma migrate dev --name nome_da_mudanca   # nova migration
npx prisma db push                              # sync direto (sem migration)
npx prisma studio                               # GUI do banco no browser
npx prisma generate                             # regenerar o client
```

### Migrations

- `prisma/migrations/20260505_init/migration.sql` — criação inicial das tabelas

## Estrutura de arquivos

```
app/
  page.tsx                    — redirect para /tv
  tv/page.tsx                 — tela da TV (polling)
  acompanhar/page.tsx         — acompanhamento do cliente (polling)
  admin/
    page.tsx                  — painel do atendente (protegido)
    login/page.tsx            — tela de login
  api/
    auth/
      login/route.ts          — POST: valida senha, seta cookie JWT
      logout/route.ts         — POST: apaga cookie
    queue/
      route.ts                — GET: lista fila | POST: adiciona paciente (admin)
      next/route.ts           — POST: chama próximo (admin)
      served/route.ts         — POST: marca como atendido (admin)
      entry/route.ts          — GET ?id=UUID: status individual + posição
lib/
  db.ts                       — Prisma Client singleton + initDB()
  auth.ts                     — signToken / verifyToken / getSession
  types.ts                    — interface QueueEntry
middleware.ts                 — proteção de rotas admin e APIs
instrumentation.ts            — roda initDB() na inicialização do servidor
prisma/
  schema.prisma
  migrations/
```

## Decisões técnicas

- **Polling (3s) em vez de SSE/WebSocket** — mais simples e mais compatível com Neon (serverless Postgres não suporta bem conexões longas)
- **JWT em cookie httpOnly** — seguro contra XSS, sem necessidade de localStorage
- **Ticket sequencial via `$queryRaw`** — UPDATE atômico no `queue_config` evita race condition
- **Prisma Client singleton** — padrão recomendado para Next.js dev (evita múltiplas instâncias com hot reload)
- **`initDB()` no `instrumentation.ts`** — garante que as linhas de config existem sem migration manual

## Próximas ideias

- QR code gerado automaticamente no admin após adicionar paciente
- Reset da fila (botão no admin para zerar tudo)
- Histórico por data (filtro no admin)
- Notificação push quando for chamado (PWA)
- Multi-atendente (mais de uma cadeira)
