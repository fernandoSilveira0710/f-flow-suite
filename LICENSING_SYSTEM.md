# Sistema de Licenciamento F-Flow Suite

## Visão Geral

O F-Flow Suite implementa um sistema de licenciamento robusto e distribuído que permite:

- **Ativação de licenças** via Hub centralizado
- **Operação offline** com período de graça
- **Sincronização automática** de planos e entitlements
- **Segurança** com JWT RS256 e armazenamento seguro
- **Interface integrada** para gerenciamento de planos

## Arquitetura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Client-Local  │    │      Hub        │
│   (React)       │    │   (NestJS)      │    │   (NestJS)      │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • Painel Billing│◄──►│ • Licensing API │◄──►│ • License API   │
│ • Seleção Planos│    │ • Secure Storage│    │ • Plan Management│
│ • Status Sync   │    │ • Auto Renewal  │    │ • JWT Signing   │
│ • Entitlements  │    │ • Grace Period  │    │ • Tenant Mgmt   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Componentes

### 1. Hub (Servidor Central)

**Localização:** `hub/`

**Responsabilidades:**
- Gerenciamento de tenants e organizações
- Criação e assinatura de licenças JWT
- Gerenciamento de planos e entitlements
- API para ativação e renovação de licenças

**Endpoints Principais:**
```
POST /licenses/activate          # Ativar licença
PUT  /licenses/:id/plan         # Atualizar plano
GET  /plans                     # Listar planos disponíveis
GET  /.well-known/jwks.json     # Chaves públicas JWT
```

**Configuração:**
```env
DATABASE_URL=postgresql://...
LICENSE_PRIVATE_KEY_PEM=-----BEGIN PRIVATE KEY-----...
LICENSE_PUBLIC_KEY_PEM=-----BEGIN PUBLIC KEY-----...
```

### 2. Client-Local (Aplicação Local)

**Localização:** `client-local/`

**Responsabilidades:**
- Proxy entre Frontend e Hub
- Armazenamento seguro de tokens
- Renovação automática de licenças
- Operação offline com período de graça
- Sincronização de mudanças de plano

**Endpoints Principais:**
```
GET  /licensing/install/status   # Status da instalação
POST /licensing/activate         # Ativar licença
GET  /licensing/license          # Obter licença atual
PUT  /licensing/plan/sync        # Sincronizar plano
```

**Configuração:**
```env
LICENSING_ENFORCED=true
HUB_BASE_URL=http://localhost:3000
GRACE_PERIOD_DAYS=7
```

### 3. Frontend (Interface do Usuário)

**Localização:** `src/`

**Responsabilidades:**
- Interface para seleção e mudança de planos
- Painel de billing e histórico
- Exibição de status de sincronização
- Controle de entitlements por funcionalidade

**Páginas Principais:**
- `/erp/settings/billing` - Painel de billing completo
- `/planos` - Seleção de planos (site institucional)

## Fluxo de Funcionamento

### 1. Ativação Inicial

```mermaid
sequenceDiagram
    participant F as Frontend
    participant C as Client-Local
    participant H as Hub
    
    F->>C: POST /licensing/activate
    C->>H: POST /licenses/activate
    H->>H: Gerar JWT RS256
    H->>C: Retorna token assinado
    C->>C: Armazenar no keystore
    C->>F: Confirmação de ativação
```

### 2. Mudança de Plano

```mermaid
sequenceDiagram
    participant F as Frontend
    participant C as Client-Local
    participant H as Hub
    
    F->>C: PUT /licensing/plan/sync
    C->>H: PUT /licenses/:id/plan
    H->>H: Atualizar plano no banco
    H->>H: Gerar nova licença
    H->>C: Nova licença JWT
    C->>C: Atualizar armazenamento
    C->>F: Confirmação + novos entitlements
```

### 3. Operação Offline

```mermaid
sequenceDiagram
    participant F as Frontend
    participant C as Client-Local
    participant S as Secure Storage
    
    F->>C: Requisição de funcionalidade
    C->>S: Verificar licença local
    S->>C: Token + data de expiração
    C->>C: Verificar período de graça
    alt Dentro do período de graça
        C->>F: Permitir operação
    else Fora do período de graça
        C->>F: Bloquear operação
    end
```

## Estrutura de Dados

### Token JWT (Licença)

```json
{
  "tid": "tenant-id",           // ID do tenant
  "did": "device-id",           // ID do dispositivo
  "plan": "pro",                // Plano ativo
  "ent": [                      // Entitlements
    "POS",
    "INVENTORY", 
    "GROOMING",
    "ANALYTICS"
  ],
  "exp": 1759582419,            // Expiração
  "grace": 7,                   // Período de graça (dias)
  "iat": 1759496019,            // Emitido em
  "iss": "f-flow-hub"           // Emissor
}
```

### Planos Disponíveis

```typescript
interface Plan {
  id: 'starter' | 'pro' | 'max';
  name: string;
  price: number;
  priceAnnual: number;
  features: string[];
  entitlements: {
    seatLimit: number;
    products: boolean;
    pdv: boolean;
    stock: boolean;
    agenda: boolean;
    banho_tosa: boolean;
    reports: boolean;
  };
}
```

## Segurança

### 1. Criptografia

- **JWT RS256**: Assinatura com chave privada no Hub
- **Verificação**: Chave pública distribuída via JWKS
- **Armazenamento**: Tokens protegidos no keystore do SO

### 2. Isolamento por Tenant

- **RLS (Row Level Security)**: Políticas no PostgreSQL
- **Middleware**: Validação automática de tenant em todas as requisições
- **Contexto**: Tenant ID extraído do JWT ou header

### 3. Período de Graça

- **Offline**: 7 dias de operação sem conexão
- **Renovação**: Tentativa automática a cada 24h
- **Degradação**: Funcionalidades bloqueadas após expiração

## Configuração e Deploy

### 1. Desenvolvimento

```bash
# Hub
cd hub
cp .env.example .env
npm install
npm run start:dev

# Client-Local  
cd client-local
cp .env.example .env
npm install
npm run start:dev

# Frontend
npm install
npm run dev
```

### 2. Produção

```bash
# Gerar chaves RSA
cd hub
node generate-keys.js

# Configurar variáveis de ambiente
DATABASE_URL=postgresql://...
LICENSE_PRIVATE_KEY_PEM=...
LICENSING_ENFORCED=true

# Build e deploy
npm run build
npm run start:prod
```

## Testes

### 1. Testes Unitários

```bash
# Hub
cd hub
npm test

# Client-Local
cd client-local  
npm test
```

### 2. Testes de Integração

```bash
# Teste completo do fluxo
cd hub
node test-sqlite-license.js
```

### 3. Validação Manual

```powershell
# Status da instalação
Invoke-RestMethod -Uri "http://localhost:3001/licensing/install/status"

# Ativação
Invoke-RestMethod -Uri "http://localhost:3001/licensing/activate" -Method POST -ContentType "application/json" -Body '{"tenantId": "demo", "deviceId": "test-device"}'

# Verificar licença
Invoke-RestMethod -Uri "http://localhost:3001/licensing/license"
```

## Monitoramento

### 1. Health Checks

- `GET /health` - Status geral do serviço
- `GET /health/deps` - Status das dependências
- `GET /licensing/install/status` - Status da licença

### 2. Logs

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "info",
  "message": "License activated successfully",
  "tenantId": "demo",
  "deviceId": "abc-123",
  "plan": "pro"
}
```

### 3. Métricas

- Taxa de ativação de licenças
- Tempo de resposta do Hub
- Falhas de sincronização
- Uso por plano/tenant

## Troubleshooting

### 1. Problemas Comuns

**Erro: "Foreign key constraint violation"**
```bash
# Verificar se o tenant existe
cd hub
npm run db:seed
```

**Erro: "JWT verification failed"**
```bash
# Verificar chaves RSA
cd hub
node generate-keys.js
```

**Erro: "License expired"**
```bash
# Forçar renovação
curl -X POST http://localhost:3001/licensing/activate
```

### 2. Logs de Debug

```bash
# Habilitar logs detalhados
export DEBUG=licensing:*
npm run start:dev
```

### 3. Reset Completo

```bash
# Limpar dados locais
rm -rf client-local/prisma/local.db*
rm -rf hub/prisma/local.db*

# Recriar banco
npm run db:reset
npm run db:seed
```

## Roadmap

### Próximas Funcionalidades

- [ ] **Auto-update**: Atualização automática do client-local
- [ ] **Métricas avançadas**: Dashboard de uso por tenant
- [ ] **Billing real**: Integração com Stripe/PayPal
- [ ] **Multi-device**: Suporte a múltiplos dispositivos por licença
- [ ] **Audit log**: Rastreamento de mudanças de plano

### Melhorias de Segurança

- [ ] **Certificate pinning**: Validação de certificado do Hub
- [ ] **Rate limiting**: Proteção contra ataques de força bruta
- [ ] **Encryption at rest**: Criptografia do banco local
- [ ] **Hardware binding**: Vinculação a hardware específico

## Contribuição

1. **Fork** o repositório
2. **Crie** uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. **Commit** suas mudanças (`git commit -am 'Adiciona nova funcionalidade'`)
4. **Push** para a branch (`git push origin feature/nova-funcionalidade`)
5. **Abra** um Pull Request

## Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.