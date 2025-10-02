# F-Flow Suite

Monorepo que abriga:
- **Web App** (React/Vite/TypeScript) com site institucional e ERP mockado.
- **Hub API** (NestJS + Postgres) para licencas, entitlements, multi-tenant e sincronizacao.
- **Cliente Local** (NestJS + SQLite) que roda on-premise com POS, estoque, grooming e agente de sync.

## Estrutura do Repositorio
```
f-flow-suite/
├─ README.md
├─ apoio.txt                   # guia completo de arquitetura
├─ package.json (web app)
├─ src/                        # frontend React
├─ hub/                        # API cloud (NestJS + Postgres)
└─ client-local/               # API local (NestJS + SQLite)
```

## 1. Frontend Web (React/Vite)
- Rotas em `src/App.tsx` cobrem site publico e ERP mockado.
- Dados sao carregados de mocks (`src/lib/*-api.ts`) persistidos em `localStorage`.
- Providers globais: React Query, Tooltip, toasts (`Toaster`, `Sonner`).

### Executar
```bash
npm install
npm run dev
```
- Servidor inicia com dados mock, sem dependencia de backend.
- Opcional: ajustar `VITE_LICENSE_HUB_URL` em `.env` para apontar para o Hub real quando existir.

### Scripts uteis
| Script | Descricao |
| ------ | --------- |
| `npm run dev` | Dev server Vite |
| `npm run build` | Build de producao |
| `npm run build:dev` | Build no modo development |
| `npm run preview` | Preview do build |
| `npm run lint` | ESLint |

## 2. Hub API (NestJS + Postgres)
Local: `hub/`
- Modulos iniciais: `auth`, `tenants`, `licenses`, `entitlements`, `sync`, `health`.
- `hub/prisma/schema.prisma` define modelo multi-tenant com tabelas de tenants, licencas, devices, outbox/inbox.
- `hub/sql/001-base.sql` e `002-rls-policies.sql` trazem seeds e policies RLS.

### Preparar ambiente
```bash
cd hub
npm install
npm run prisma:migrate     # gera/roda migracoes
psql $DATABASE_URL -f sql/002-rls-policies.sql
npm run start:dev
```
- Variaveis base em `hub/.env.example` (DATABASE_URL, chaves JWS, configuracao OIDC, webhooks).
- `src/common/env.ts` carrega `.env` automaticamente.
- Controllers ainda sao stubs: implementar chamadas reais usando Prisma antes de liberar em producao.

## 3. Cliente Local (NestJS + SQLite)
Local: `client-local/`
- Modulos: `pos`, `inventory`, `grooming`, `licensing`, `sync-agent`.
- `client-local/prisma/schema.prisma` contem tabelas de vendas, outbox, inbox, sync state e metodos de pagamento locais.

### Preparar ambiente
```bash
cd client-local
npm install
npm run prisma:migrate
npm run start:dev
```
- Configuracao base em `client-local/.env.example` (DATABASE_URL SQLite, HUB_BASE_URL, LICENSE_PUBLIC_KEY, DEVICE_ID, intervalo de sync).
- `sync-agent` expone metodos para `pushOutbox` e `pullCommands`, integrando-se ao Hub via HTTP (Axios).
- Services estao mockados para acelerar evolucao; conectar com Prisma assim que migracoes estiverem prontas.

## 4. Proximos Passos
1. **Backend real**: ligar Prisma nas services do Hub e do Cliente local, implementar rotas completas e validacoes.
2. **Seguranca**: substituir guard OIDC mockado por integracao real (Auth0/Keycloak/Cognito) e validar JWS com chave publica.
3. **Sync**: finalizar pipelines de outbox/inbox (fila, retries, idempotencia) e configurar RLS no Postgres multi-tenant.
4. **Automacao**: adicionar pipelines de teste/build, scripts de deploy e observabilidade (health, logs, metrics).
5. **Integração frontend**: substituir mocks do app React por chamadas autenticadas ao Hub quando os endpoints estiverem disponiveis.

Para um walkthrough detalhado de arquitetura, consulte `apoio.txt`.
