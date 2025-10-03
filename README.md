# F-Flow Suite

Monorepo que abriga:
- **Web App** (React/Vite/TypeScript) com site institucional e ERP mockado.
- **Hub API** (NestJS + Postgres) para licenças, entitlements, multi-tenant e sincronização.
- **Cliente Local** (NestJS + SQLite) que roda on-premise com POS, estoque, grooming e agente de sync.

## Estrutura do Repositório
```
f-flow-suite/
├─ README.md
├─ apoio.txt                   # guia completo de arquitetura
├─ package.json                # frontend React
├─ src/                        # código do web app
├─ hub/                        # API cloud (NestJS + Postgres + Prisma)
├─ client-local/               # API local (NestJS + SQLite + Prisma)
└─ postman/                    # coleções e ambientes Postman
```

## 1. Frontend Web (React/Vite)
- Rotas em `src/App.tsx` cobrem site público e ERP mockado.
- Dados são carregados de mocks (`src/lib/*-api.ts`) persistidos em `localStorage`.
- Providers globais: React Query, Tooltip, toasts (`Toaster`, `Sonner`).

### Executar
```bash
npm install
npm run dev
```
- Servidor inicia com dados mock, sem dependência de backend.
- Opcional: ajustar `VITE_LICENSE_HUB_URL` em `.env` para apontar para o Hub real quando existir.

### Scripts úteis
| Script | Descrição |
| ------ | --------- |
| `npm run dev` | Dev server Vite |
| `npm run build` | Build de produção |
| `npm run build:dev` | Build no modo development |
| `npm run preview` | Preview do build |
| `npm run lint` | ESLint |

## 2. Hub API (NestJS + Postgres)
Local: `hub/`
- Módulos iniciais: `auth`, `tenants`, `licenses`, `entitlements`, `sync`, `health`.
- Middleware `PrismaTenantMiddleware` seta `SET app.tenant_id` para cada request (via header `x-tenant-id` ou usuário autenticado) e ativa as policies RLS.
- `hub/prisma/schema.prisma` define modelo multi-tenant (tenants, licenses, entitlements, payment methods, outbox/inbox).
- `hub/sql/002-rls-policies.sql` habilita RLS e garante isolamento por tenant.
- `hub/prisma/seed.ts` popula org/tenant demo, licença trial, entitlements do plano `pro` e métodos de pagamento básicos.
- Endpoint de ativação de licença: `POST /licenses/activate` retornando um token JWS RS256 assinado com a chave privada configurada.

### Preparar ambiente
```bash
cd hub
npm install
npm run prisma:migrate          # gera/roda migrações
psql $DATABASE_URL -f sql/002-rls-policies.sql
npm run prisma:seed             # org demo + licença trial + entitlements
npm run start:dev
```

#### Variáveis importantes (`hub/.env.example`)
```
DATABASE_URL=postgresql://user:pass@host:5432/fflow
PORT=8080
# Gere as chaves (dev):
# openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out license_private.pem
# openssl rsa -pubout -in license_private.pem -out license_public.pem
LICENSE_PRIVATE_KEY_PEM="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
```
(O conteúdo da chave privada deve ser colado em uma única linha com `\n`.)

#### Coleção Postman
Arquivos em `postman/`:
- `F-Flow-Hub.postman_collection.json`
- `F-Flow-Hub.postman_environment.json`

Passos:
1. Importe a coleção e o ambiente no Postman.
2. Atualize a variável `tenant_id` do ambiente com o UUID do tenant criado (veja log do seed).
3. Opcionalmente ajuste `hub_url` e `device_id`.
4. Execute **Health Check** para validar o serviço e gravar `last_healthcheck`.
5. Execute **Ativar Licença** para receber o JWT e salvar em `license_token`.

#### Teste rápido via cURL
```bash
curl -X POST http://localhost:8080/licenses/activate \
  -H "Content-Type: application/json" \
  -d '{"tenantId":"<UUID_DO_TENANT>","deviceId":"dev-01"}'
```
→ Resposta esperada: `{ "licenseToken": "<JWT_RS256>" }`.

Para validar RLS, execute uma query com `x-tenant-id` incorreto: o select deve retornar zero linhas.

#### Autenticação OIDC e Licenciamento

O Hub implementa autenticação dupla:
1. **OIDC (OpenID Connect)**: Validação de identidade via token JWT do IdP
2. **Licenciamento**: Validação de licença e entitlements via token próprio

##### Configuração OIDC

Variáveis de ambiente necessárias no `hub/.env`:
```bash
# OIDC Configuration
OIDC_REQUIRED=true                                    # Habilita validação OIDC
OIDC_JWKS_URL=https://your-idp.com/.well-known/jwks.json
OIDC_ISSUER=https://your-idp.com/
OIDC_AUDIENCE=f-flow-suite-hub

# Licensing Configuration  
LICENSING_ENFORCED=true                               # Habilita validação de licença
LICENSE_PUBLIC_KEY_PEM="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
```

##### Rotas Protegidas

As seguintes rotas requerem ambos os tokens:
- `/tenants/*` - Gestão de tenants
- `/tenants/{id}/sync/*` - Sincronização de dados

**Headers necessários:**
```bash
Authorization: Bearer <oidc-token>      # Token do IdP (Auth0, Keycloak, etc.)
X-License-Token: <license-token>        # Token de licença obtido via /licenses/activate
```

##### Cenários de Teste (Postman)

A coleção Postman inclui cenários para validar:
1. **Sem tokens** → 401 Unauthorized
2. **Apenas OIDC** → 403 Forbidden (falta licença)
3. **OIDC + Licença** → 200 Success

##### Rollback para Desenvolvimento

Para desabilitar autenticação durante desenvolvimento:
```bash
# Desabilita OIDC (apenas licença será validada)
OIDC_REQUIRED=false

# Desabilita ambos (acesso livre)
OIDC_REQUIRED=false
LICENSING_ENFORCED=false
```

## 3. Cliente Local (NestJS + SQLite)
Local: `client-local/`
- Módulos: `pos`, `inventory`, `grooming`, `licensing`, `sync-agent`.
- `client-local/prisma/schema.prisma` define vendas, estoque, outbox/inbox e métodos de pagamento locais.
- `sync-agent` publica eventos (`pushOutbox`) e consome comandos (`pullCommands`) do Hub usando Axios.

### Preparar ambiente
```bash
cd client-local
npm install
npm run prisma:migrate
npm run start:dev
```

#### Variáveis (`client-local/.env.example`)
```
NODE_ENV=development
PORT=3010
DATABASE_URL="file:./local.db"
HUB_BASE_URL=https://hub.2fsolutions.com.br/api
LICENSE_FILE=./license.jwt
LICENSE_PUBLIC_KEY_PEM="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
DEVICE_ID=<guid-da-maquina>
SYNC_INTERVAL_MS=60000
```

## 4. Próximos Passos
1. **Backend real**: ligar Prisma nas services do Hub e do Cliente local, implementando queries de verdade (tenants, sync commands, etc.).
2. **Segurança**: integrar OIDC real (Auth0/Keycloak/Cognito), validar token e substituir guard placeholder.
3. **Sync**: finalizar pipelines de outbox/inbox (fila, retries, idempotência) e expandir policies RLS conforme novos domínios.
4. **Automação**: adicionar pipelines de teste/build, scripts de deploy e observabilidade (health, logs, métricas, tracing).
5. **Integração frontend**: substituir mocks do app React por chamadas autenticadas ao Hub quando endpoints estiverem estáveis.

Para detalhes arquiteturais completos, consulte `apoio.txt`.
