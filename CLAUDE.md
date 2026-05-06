# Canto do Cabelo — Sistema de Fila de Espera

Sistema de ordem de chegada para barbearia/salão. Clientes acompanham sua posição pelo celular, a TV exibe a fila em tempo real, e o atendente gerencia tudo por um painel protegido por senha.

## Stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS v4**
- **Prisma 5** + **PostgreSQL no Neon** (serverless, sa-east-1)
- **jose** — JWT para autenticação do admin
- **qrcode.react** — geração de QR code no admin
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
Ambos estão no `.gitignore` (`.env*`) — nunca são commitados.

## Páginas

| Rota | Quem usa | Descrição |
|---|---|---|
| `/` | — | Redireciona para `/tv` |
| `/tv` | TV do salão | Fila em tempo real (polling 5s), tela cheia dark |
| `/fila` | Clientes | Fila pública mobile-friendly (polling 5s) |
| `/admin` | Dono | Adicionar clientes, chamar próximo, finalizar — requer login |
| `/admin/login` | Dono | Login com senha (cookie JWT 12h) |
| `/acompanhar?id=UUID` | Cliente | Cliente vê sua posição em tempo real (polling 30s) |

## Fluxo de uso

1. Cliente chega → admin acessa `/admin` e adiciona o nome + seleciona os serviços
2. Sistema gera número de senha sequencial, exibe posição na fila + QR code + link de acompanhamento
3. Admin escaneia o QR code ou copia o link e manda pro cliente (WhatsApp etc.)
4. Cliente abre o link no celular e acompanha sua posição (atualiza a cada 30s)
5. Admin clica "Chamar Próximo" → TV atualiza; o paciente anterior em atendimento é finalizado automaticamente
6. Admin clica "Finalizar" → cliente marcado como atendido
7. Admin pode remover um cliente da fila (com confirmação) caso ele não esteja presente

## Proteção do admin

- `proxy.ts` (equivalente ao middleware no Next.js 16) bloqueia `/admin/*` e rotas de escrita sem sessão válida
- **ATENÇÃO:** No Next.js 16 o arquivo se chama `proxy.ts` (não `middleware.ts`) e exporta `export async function proxy()`
- Login via `POST /api/auth/login` com `{ password }` → seta cookie `session` (httpOnly, 12h)
- Logout via `POST /api/auth/logout` → apaga o cookie
- Senha configurada em `ADMIN_PASSWORD` no `.env.local`
- Rotas protegidas: `/admin/*`, `POST /api/queue`, `POST /api/queue/next`, `POST /api/queue/served`, `POST /api/queue/remove`

## Serviços disponíveis (`lib/services.ts`)

| ID | Nome | Duração |
|---|---|---|
| `corte` | Corte de Cabelo | 30 min |
| `barba` | Barba | 20 min |
| `sobrancelha` | Sobrancelha | 15 min |
| `hidratacao` | Hidratação | 25 min |
| `coloracao` | Coloração | 60 min |

- Admin seleciona os serviços ao adicionar o cliente
- Tempo estimado calculado em tempo real no formulário
- Tempo de espera exibido na fila = soma dos serviços dos que estão **na frente** (não inclui o próprio serviço do cliente)
- Primeiro da fila sempre exibe "em breve" em vez de tempo
- Admin vê os serviços e tempo estimado na lista da fila

## Banco de dados (Prisma + Neon)

### Schema (`prisma/schema.prisma`)

```prisma
model QueueEntry {
  id        String      @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name      String      @db.VarChar(100)
  ticket    Int
  status    EntryStatus @default(waiting)   // waiting | called | served
  services  String[]    @default([])        // IDs dos serviços selecionados
  createdAt DateTime    @default(now()) @map("created_at") @db.Timestamptz
  calledAt  DateTime?   @map("called_at") @db.Timestamptz
}

model QueueConfig {
  key   String  @id   // "current_ticket" | "last_called_id"
  value String?
}

enum EntryStatus { waiting called served }
```

### Comandos Prisma

```bash
npx prisma db push                              # sync direto com o banco (usar no Neon)
npx prisma studio                               # GUI do banco no browser
npx prisma generate                             # regenerar o client
```

> **Atenção:** `prisma migrate dev` falha no Neon por falta de shadow database. Usar sempre `prisma db push`.

### Migrations

- `prisma/migrations/20260505_init/migration.sql` — criação inicial das tabelas
- `prisma/migrations/20260505_add_services/migration.sql` — coluna `services TEXT[]`

## Estrutura de arquivos

```
app/
  page.tsx                    — redirect para /tv
  tv/page.tsx                 — tela da TV (polling 5s, mostra tempo de espera acumulado)
  fila/page.tsx               — fila pública mobile (polling 5s)
  acompanhar/page.tsx         — acompanhamento do cliente (polling 30s, mostra posição)
  admin/
    page.tsx                  — painel do atendente (protegido)
    login/page.tsx            — tela de login
  api/
    auth/
      login/route.ts          — POST: valida senha, seta cookie JWT
      logout/route.ts         — POST: apaga cookie
    queue/
      route.ts                — GET: lista fila | POST: adiciona cliente (admin)
      next/route.ts           — POST: finaliza atual + chama próximo (admin)
      served/route.ts         — POST: marca como finalizado (admin)
      remove/route.ts         — POST: remove cliente waiting da fila (admin)
      entry/route.ts          — GET ?id=UUID: status individual + posição
lib/
  db.ts                       — Prisma Client singleton + initDB()
  auth.ts                     — signToken / verifyToken / getSession
  types.ts                    — interface QueueEntry (inclui services: string[])
  services.ts                 — SERVICES[], calcMinutes(), formatMinutes()
proxy.ts                      — proteção de rotas (Next.js 16 usa proxy.ts, não middleware.ts)
instrumentation.ts            — roda initDB() na inicialização do servidor
prisma/
  schema.prisma
  migrations/
    20260505_init/
    20260505_add_services/
```

## Comportamentos importantes

### Chamar Próximo
A rota `POST /api/queue/next` faz duas coisas atomicamente:
1. Marca qualquer entrada com `status = 'called'` como `served`
2. Pega a primeira entrada `waiting` (menor ticket) e muda para `called`

Isso garante que ao chamar o próximo, o anterior é sempre finalizado — sem necessidade de clicar "Finalizar" antes.

### Posição vs Senha
- **Senha (ticket):** número sequencial gerado na entrada, nunca muda, usado internamente
- **Posição:** posição atual na fila de espera (1º, 2º, 3º…), calculada dinamicamente
- As telas públicas (`/acompanhar`, `/fila`, `/tv`) exibem **posição**, não senha

### QR Code
Ao adicionar um cliente no admin, o card exibe:
- Posição na fila ("João adicionado na 3ª na fila")
- QR code escaneável apontando para `/acompanhar?id=UUID`
- Link copiável

### Remoção da fila
- Botão "remover" visível em cada cliente com `status = waiting` no admin
- Exige confirmação inline antes de remover
- Só remove entradas `waiting` — não afeta quem está em atendimento

## Decisões técnicas

- **Polling diferenciado** — `/acompanhar` usa 30s (leve para o cliente), demais telas usam 5s
- **JWT em cookie httpOnly** — seguro contra XSS, sem necessidade de localStorage
- **Ticket sequencial via `$queryRaw`** — UPDATE atômico no `queue_config` evita race condition
- **Prisma Client singleton** — padrão recomendado para Next.js dev (evita múltiplas instâncias com hot reload)
- **`initDB()` no `instrumentation.ts`** — garante que as linhas de config existem sem migration manual
- **`proxy.ts` em vez de `middleware.ts`** — Next.js 16 renomeou o arquivo de middleware, exporta `proxy` em vez de `middleware`
- **`prisma db push` em vez de migrate** — Neon serverless não suporta shadow database
- **`.env*` no .gitignore** — credenciais nunca são commitadas

## Segurança — estado atual

- `.env` e `.env.local` estão no `.gitignore`, nunca vão para o repositório ✅
- Rotas admin protegidas por JWT via `proxy.ts` ✅
- Cookie httpOnly (protegido contra XSS) ✅
- Senha do admin em variável de ambiente, não hardcoded ✅

## Próximas ideias

- Reset da fila (botão no admin para zerar tudo)
- Histórico por data (filtro no admin)
- Notificação push quando for chamado (PWA)
- Multi-atendente (mais de uma cadeira)
- Rate limiting no login (proteger contra brute force)
- Validar UUID nos endpoints de entrada
