# F-Flow Suite

Monorepo que abriga:
- **Web App** (React/Vite/TypeScript) com site institucional e ERP mockado.
- **Hub API** (NestJS + Postgres) para licenças, entitlements, multi-tenant e sincronização.
- **Cliente Local** (NestJS + SQLite) que roda on-premise com POS, estoque, grooming e agente de sync.

## 🚀 Etapa 1 — Como testar

### Pré-requisitos
- Node.js 18+
- Docker e Docker Compose
- PostgreSQL (via Docker)

### Setup rápido (1 comando)
```bash
# Instalar dependências em todos os pacotes
npm install
cd hub && npm install && cd ../client-local && npm install && cd ..

# Subir PostgreSQL + Adminer
npm run dev:up

# Verificar se tudo está funcionando
npm run check:all
```

### Serviços disponíveis
Após o setup, você terá:
- **Frontend ERP**: http://localhost:8080/erp/login
- **Site Institucional**: http://localhost:5173
- **Hub API**: http://localhost:3001 (NestJS + PostgreSQL)
- **Client-local API**: http://localhost:8081 (NestJS + SQLite)
- **Prisma Studio HUB**: http://localhost:5555 (Base de dados do HUB)
- **Prisma Studio Client-Local**: http://localhost:5556 (Base de dados local)
- **Adminer**: http://localhost:8080 (PostgreSQL UI)
- **PostgreSQL**: localhost:5432

### 👥 Usuários de Teste

#### Usuários cadastrados no HUB (localhost:5555):
1. **Admin Principal**
   - Email: `luisfernando@email.com`
   - Senha: `123456`
   - Role: `admin`

2. **Usuário de Teste**
   - Email: `teste@exemplo.com`
   - Senha: `123456`
   - Role: `admin`

3. **Login de Teste**
   - Email: `logintest@2fsolutions.com.br`
   - Senha: `123456`
   - Role: `admin`

4. **Terceiro Usuário**
   - Email: `terceiro@exemplo.com`
   - Senha: `123456`
   - Role: `admin`

### 🔗 URLs dos Serviços

| Serviço | URL | Descrição |
| ------- | --- | --------- |
| **ERP Login** | http://localhost:8080/erp/login | Interface de login do ERP |
| **ERP Dashboard** | http://localhost:8080/erp/dashboard | Dashboard principal do ERP |
| **Site Institucional** | http://localhost:5173 | Site público da empresa |
| **Hub API** | http://localhost:3001 | API do HUB (autenticação, licenças) |
| **Client-Local API** | http://localhost:8081 | API local (POS, estoque, grooming) |
| **Prisma Studio HUB** | http://localhost:5555 | Interface do banco HUB |
| **Prisma Studio Local** | http://localhost:5556 | Interface do banco local |
| **Adminer** | http://localhost:8080 | Interface PostgreSQL |

### Scripts principais
| Script | Descrição |
| ------ | --------- |
| `npm run dev:up` | Sobe PostgreSQL + Adminer via Docker |
| `npm run dev:down` | Para e remove containers Docker |
| `npm run check:all` | Executa lint + typecheck em todos os pacotes |
| `npm run check:hub` | Lint + typecheck apenas no Hub |
| `npm run check:client` | Lint + typecheck apenas no Client-local |
| `npm run check:web` | Lint + typecheck apenas no Frontend |

### Teste de saúde
```bash
# Verificar se o Hub está funcionando
curl http://localhost:3001/health

# Verificar se o Client-local está funcionando  
curl http://localhost:8081/pos/sales -X POST -H "Content-Type: application/json" -d "{}"
```

### Configuração de ambiente
Copie os arquivos `.env.example` para `.env` em cada pacote:
```bash
cp hub/.env.example hub/.env
cp client-local/.env.example client-local/.env
```

### Flags de desenvolvimento
- `DEV_COMPOSE_ENABLED=true` - Habilita Docker Compose para desenvolvimento

### Rollback
Para reverter o ambiente de desenvolvimento:
```bash
npm run dev:down
rm hub/.env client-local/.env
```

---

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

#### Sistema de Autenticação

O F-Flow Suite implementa um sistema de autenticação robusto que suporta dois modos de operação:

##### 🌐 Modo Online (Hub + Client-Local)

**Fluxo de Autenticação Completo:**
1. **Tentativa no Hub**: O frontend tenta autenticar no Hub (localhost:8081)
2. **Validação OIDC + Licenciamento**: Hub valida credenciais e licença
3. **Sincronização Local**: Dados são sincronizados com o client-local
4. **Acesso Completo**: Usuário tem acesso a todas as funcionalidades

**Configuração Hub (`hub/.env`):**
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

##### 💻 Modo Offline (Client-Local Apenas)

**Fluxo de Autenticação Offline:**
1. **Hub Indisponível**: Frontend detecta que o Hub não está acessível
2. **Fallback Automático**: Sistema tenta autenticação no client-local (localhost:8081)
3. **Validação Local**: Client-local valida credenciais usando dados em cache
4. **Verificação de Licença**: Valida licença local e período de graça
5. **Acesso Limitado**: Usuário acessa funcionalidades offline disponíveis

**Endpoint de Autenticação Offline:**
```bash
POST /auth/offline-login
Content-Type: application/json

{
  "email": "usuario@exemplo.com",
  "password": "senha123"
}
```

**Respostas Possíveis:**
- `201 Created`: Login offline bem-sucedido
- `401 Unauthorized`: Credenciais inválidas ou usuário não encontrado
- `403 Forbidden`: Licença expirada sem período de graça
- `404 Not Found`: Endpoint não disponível (client-local não configurado)

##### 🔄 Mensagens de Erro Amigáveis

O sistema fornece feedback claro para diferentes cenários:

**Hub Indisponível:**
- "Servidor principal indisponível. Tentando login offline com dados em cache..."

**Falha no Client-Local:**
- "Serviço local não está executando. Verifique se o F-Flow Client está instalado e ativo."
- "Credenciais inválidas para login offline."
- "Usuário não encontrado nos dados locais."
- "Licença expirada. Entre em contato com o suporte."

##### 🛡️ Rotas Protegidas

**Headers necessários (Modo Online):**
```bash
Authorization: Bearer <oidc-token>      # Token do IdP (Auth0, Keycloak, etc.)
X-License-Token: <license-token>        # Token de licença obtido via /licenses/activate
```

**Headers necessários (Modo Offline):**
```bash
Authorization: Bearer <offline-token>   # Token gerado pelo client-local
```

##### 🧪 Cenários de Teste

**Teste Modo Online:**
1. Hub e Client-Local executando
2. Login com credenciais válidas
3. Verificar sincronização de dados

**Teste Modo Offline:**
1. Parar o Hub (`npm run dev:down` no diretório hub)
2. Manter Client-Local executando
3. Tentar login - deve funcionar com dados em cache
4. Verificar funcionalidades offline disponíveis

##### ⚙️ Configuração para Desenvolvimento

**Desabilitar autenticação (desenvolvimento):**
```bash
# Hub - Desabilita OIDC (apenas licença será validada)
OIDC_REQUIRED=false

# Hub - Desabilita ambos (acesso livre)
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
PORT=3001
DATABASE_URL="file:./local.db"
HUB_BASE_URL=http://localhost:3001
LICENSE_FILE=./license.jwt
LICENSE_PUBLIC_KEY_PEM="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
DEVICE_ID=<guid-da-maquina>
SYNC_INTERVAL_MS=60000
```

#### Endpoints de Sincronização

O Cliente Local oferece os seguintes endpoints para sincronização com o Hub:

##### Visualizar Eventos Pendentes
```bash
GET /sync/events
```
Retorna todos os eventos na OutboxEvent, incluindo status de processamento:
```json
{
  "total": 1,
  "events": [
    {
      "id": "e84eff5b-8578-443d-bbbb-dc6112992d88",
      "eventType": "sale.created.v1",
      "payload": { /* dados da venda */ },
      "processed": false,
      "createdAt": "2025-10-03T18:57:57.663Z",
      "processedAt": null
    }
  ]
}
```

##### Sincronizar Eventos Pendentes
```bash
POST /sync/push/pending
```
Envia todos os eventos não processados para o Hub e os marca como processados:
```bash
# Exemplo de uso
curl -X POST http://localhost:8081/sync/push/pending
# Resposta: número de eventos sincronizados
```

##### Sincronizar Eventos Específicos
```bash
POST /sync/push
```
Permite enviar eventos específicos para o Hub:
```json
{
  "events": [
    {
      "id": "evt-001",
      "aggregate": "sale",
      "type": "sale.created.v1",
      "payload": { /* dados do evento */ },
      "occurredAt": "2024-01-01T10:00:00Z"
    }
  ]
}
```

##### Receber Comandos do Hub
```bash
GET /sync/pull
```
Busca comandos pendentes do Hub para execução local.

#### Testando a Sincronização

1. **Criar uma venda** (gera evento `sale.created.v1`):
```bash
curl -X POST http://localhost:8081/pos/sales \
  -H "Content-Type: application/json" \
  -d '{
    "operator": "Operador Teste",
    "paymentMethod": "dinheiro",
    "items": [
      {
        "productId": "produto-id",
        "qty": 2,
        "unitPrice": 29.9
      }
    ]
  }'
```

2. **Verificar eventos pendentes**:
```bash
curl http://localhost:8081/sync/events
```

3. **Sincronizar com o Hub**:
```bash
curl -X POST http://localhost:8081/sync/push/pending
```

4. **Confirmar processamento**:
```bash
curl http://localhost:8081/sync/events
# Verificar se "processed": true
```

## 4. Funcionalidades Implementadas

### Customers (Clientes)
O sistema agora inclui funcionalidades completas para gerenciamento de clientes:

#### Backend (Hub API)
- **Endpoints disponíveis**:
  - `GET /tenants/{tenantId}/customers` - Lista clientes com paginação, busca e filtros
  - `GET /tenants/{tenantId}/customers/{id}` - Busca cliente por ID
- **Funcionalidades**:
  - Paginação com `page` e `limit`
  - Busca por nome com parâmetro `search`
  - Filtro por status ativo com parâmetro `active`
  - Sincronização via eventos (`customer.upserted.v1`, `customer.deleted.v1`)
  - Suporte multi-tenant com RLS (Row Level Security)

#### Frontend (React)
- **API Client** (`src/lib/customers-api.ts`):
  - `fetchCustomers()` - Lista com filtros opcionais
  - `fetchCustomer(id)` - Busca por ID
  - `createCustomer(data)` - Criação (mock)
  - `updateCustomer(id, data)` - Atualização (mock)
  - `deleteCustomer(id)` - Exclusão (mock)
  - `searchCustomers(query)` - Busca por nome
  - `fetchActiveCustomers()` - Lista apenas ativos

### Pets (Animais de Estimação)
Sistema completo para gerenciamento de pets e relacionamento com tutores:

#### Backend (Hub API)
- **Endpoints disponíveis**:
  - `GET /tenants/{tenantId}/pets` - Lista pets com paginação, busca e filtros
  - `GET /tenants/{tenantId}/pets/{id}` - Busca pet por ID
  - `GET /tenants/{tenantId}/pets/tutor/{tutorId}` - Lista pets de um tutor específico
- **Funcionalidades**:
  - Paginação com `page` e `limit`
  - Busca por nome com parâmetro `search`
  - Filtro por tutor com parâmetro `tutorId`
  - Filtro por status ativo com parâmetro `active`
  - Sincronização via eventos (`pet.upserted.v1`, `pet.deleted.v1`)
  - Suporte multi-tenant com RLS

#### Frontend (React)
- **API Client** (`src/lib/pets-api.ts`):
  - `fetchPets()` - Lista com filtros opcionais
  - `fetchPet(id)` - Busca por ID
  - `fetchPetsByTutor(tutorId)` - Lista pets de um tutor
  - `createPet(data)` - Criação (mock)
  - `updatePet(id, data)` - Atualização (mock)
  - `deletePet(id)` - Exclusão (mock)
  - `searchPets(query)` - Busca por nome
  - `fetchActivePets()` - Lista apenas ativos
  - `fetchPetSpecies()` - Lista espécies disponíveis

### Estrutura do Banco de Dados
```sql
-- Customers (Clientes)
model Customer {
  id        String   @id @default(cuid())
  tenantId  String
  name      String
  email     String?
  phone     String?
  address   String?
  active    Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relacionamentos
  pets      Pet[]
  
  @@map("customers")
}

-- Pets (Animais)
model Pet {
  id        String   @id @default(cuid())
  tenantId  String
  name      String
  species   String
  breed     String?
  birthDate DateTime?
  tutorId   String   // Referência ao Customer
  active    Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relacionamentos
  tutor     Customer @relation(fields: [tutorId], references: [id])
  
  @@map("pets")
}
```

### Testes Implementados
- **Backend**: Testes unitários para `CustomersService` e `PetsService`
- **Frontend**: Testes unitários para APIs de customers e pets
- **Postman**: Endpoints adicionados à collection para testes de integração

### Sincronização de Dados
Ambos os módulos (Customers e Pets) suportam sincronização bidirecional:
- **Eventos de saída**: Criação, atualização e exclusão geram eventos para o Hub
- **Comandos de entrada**: Hub pode enviar comandos para atualizar dados locais
- **Idempotência**: Eventos são processados apenas uma vez
- **Multi-tenant**: Dados isolados por tenant com RLS

## 5. Próximos Passos
1. **Backend real**: ligar Prisma nas services do Hub e do Cliente local, implementando queries de verdade (tenants, sync commands, etc.).
2. **Segurança**: integrar OIDC real (Auth0/Keycloak/Cognito), validar token e substituir guard placeholder.
3. **Sync**: finalizar pipelines de outbox/inbox (fila, retries, idempotência) e expandir policies RLS conforme novos domínios.
4. **Automação**: adicionar pipelines de teste/build, scripts de deploy e observabilidade (health, logs, métricas, tracing).
5. **Integração frontend**: substituir mocks do app React por chamadas autenticadas ao Hub quando endpoints estiverem estáveis.

Para detalhes arquiteturais completos, consulte `apoio.txt`.
