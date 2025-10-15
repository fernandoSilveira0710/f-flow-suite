# Sincronização de Services e Professionals

## Visão Geral

Este documento descreve a implementação da sincronização de entidades `Service` e `Professional` entre o Hub e o Client Local no sistema F-Flow.

## Arquitetura

### Hub (Centralizador)
- Recebe eventos de múltiplos Client Locals
- Processa e armazena dados de Services e Professionals
- Aplica políticas RLS (Row Level Security) por tenant
- Distribui comandos para Client Locals quando necessário

### Client Local
- Gera eventos quando Services/Professionals são criados/atualizados/deletados
- Envia eventos para o Hub via API de sincronização
- Não processa eventos recebidos do Hub (apenas envia)

## Entidades

### Service
```typescript
{
  id: string
  name: string
  description?: string
  price: number
  duration?: number
  category?: string
  active: boolean
  createdAt: DateTime
  updatedAt: DateTime
  tenantId: string
}
```

### Professional
```typescript
{
  id: string
  name: string
  email?: string
  phone?: string
  document?: string
  specialty?: string
  services?: string[]
  active: boolean
  createdAt: DateTime
  updatedAt: DateTime
  tenantId: string
}
```

## Padrões de Eventos no F-Flow

O sistema F-Flow utiliza dois padrões principais para eventos de sincronização:

### 1. Padrão Principal (Upserted)
Usado pela maioria das entidades para simplificar a sincronização:
- `{entity}.upserted.v1` - Para operações de criação e atualização
- `{entity}.deleted.v1` - Para operações de deleção

**Entidades que usam este padrão:**
- `product.upserted.v1` / `product.deleted.v1`
- `customer.upserted.v1` / `customer.deleted.v1`
- `pet.upserted.v1` / `pet.deleted.v1`
- `service.upserted.v1` / `service.deleted.v1`
- `professional.upserted.v1` / `professional.deleted.v1`

### 2. Padrão Específico (Created/Updated)
Usado por módulos específicos que precisam distinguir entre criação e atualização:
- `{entity}.created.v1` - Para criações
- `{entity}.updated.v1` - Para atualizações
- `{entity}.deleted.v1` - Para deleções

**Entidades que usam este padrão:**
- `sale.created.v1` (vendas são sempre criadas, nunca atualizadas)
- `appointment.created.v1` / `appointment.updated.v1` / `appointment.deleted.v1`
- `grooming.ticket.created.v1` / `grooming.ticket.updated.v1`

### Vantagens do Padrão Upserted
1. **Simplicidade**: Menos eventos para gerenciar
2. **Idempotência**: Facilita reprocessamento de eventos
3. **Sincronização**: Reduz complexidade na sincronização
4. **Performance**: Menos processadores de eventos no Hub

## Eventos de Sincronização

### Service Events
- `service.upserted.v1` - Quando um serviço é criado ou atualizado
- `service.deleted.v1` - Quando um serviço é deletado

**Nota**: O sistema usa o padrão `upserted` para operações de criação e atualização, seguindo o padrão principal do F-Flow. Alguns módulos específicos (como grooming) podem usar eventos separados `created.v1` e `updated.v1` para necessidades específicas de negócio.

### Professional Events
- `professional.upserted.v1` - Quando um profissional é criado ou atualizado
- `professional.deleted.v1` - Quando um profissional é deletado

## Implementação no Hub

### 1. Modelos Prisma
As entidades `Service` e `Professional` foram adicionadas ao schema do Hub com:
- Campos obrigatórios e opcionais
- Relacionamentos com outras entidades
- Campo `tenantId` para isolamento por tenant

### 2. Migrações SQL
Arquivo: `hub/sql/003-rls-business-entities.sql`
- Criação das tabelas `Service` e `Professional`
- Configuração de RLS (Row Level Security)
- Políticas de isolamento por tenant

### 3. Processadores de Eventos
Arquivo: `hub/src/sync/sync.service.ts`
- `processServiceUpserted()` - Processa criação/atualização de serviços
- `processServiceDeleted()` - Processa deleção de serviços
- `processProfessionalUpserted()` - Processa criação/atualização de profissionais
- `processProfessionalDeleted()` - Processa deleção de profissionais

### 4. APIs REST
Arquivo: `hub/src/services/services.controller.ts` e `hub/src/professionals/professionals.controller.ts`
- GET `/tenants/{tenantId}/services` - Lista serviços
- GET `/tenants/{tenantId}/services/{id}` - Busca serviço por ID
- GET `/tenants/{tenantId}/professionals` - Lista profissionais
- GET `/tenants/{tenantId}/professionals/{id}` - Busca profissional por ID

## Implementação no Client Local

### 1. Modelos Prisma
As entidades `Service` e `Professional` já existiam no schema do Client Local com estrutura similar ao Hub.

### 2. Geração de Eventos
Arquivos: `client-local/src/grooming/services.service.ts` e `client-local/src/grooming/professionals.service.ts`
- Geram eventos automaticamente nas operações CRUD
- Eventos são armazenados na tabela `outboxEvent`
- Sincronização via `SyncService`

### 3. Sincronização
Arquivo: `client-local/src/sync-agent/sync.service.ts`
- `pushOutbox()` - Envia eventos pendentes para o Hub
- `pullCommands()` - Busca comandos do Hub (não implementado para Services/Professionals)

## Row Level Security (RLS)

### Políticas Implementadas

#### Service
```sql
CREATE POLICY tenant_isolation_service ON "Service"
FOR ALL TO authenticated
USING ("tenantId" = current_setting('app.current_tenant_id', true));
```

#### Professional
```sql
CREATE POLICY tenant_isolation_professional ON "Professional"
FOR ALL TO authenticated
USING ("tenantId" = current_setting('app.current_tenant_id', true));
```

### Como Funciona
1. Cada requisição define o `tenantId` via `current_setting('app.current_tenant_id')`
2. As políticas RLS garantem que apenas dados do tenant correto sejam acessíveis
3. Isolamento completo entre tenants

## Testes

### Postman Collections

#### Hub
Arquivo: `postman/F-Flow-Hub.postman_collection.json`
- Seção "Services" com testes de listagem e busca por ID
- Seção "Professionals" com testes de listagem e busca por ID
- Testes de autenticação e autorização

#### Client Local
Arquivo: `postman/F-Flow-Client-Local.postman_collection.json`
- CRUD completo para Services
- CRUD completo para Professionals
- Testes de sincronização

### Cenários de Teste

1. **Operações CRUD no Client Local**
   - Criar Service/Professional (gera `service.upserted.v1` / `professional.upserted.v1`)
   - Atualizar Service/Professional (gera `service.upserted.v1` / `professional.upserted.v1`)
   - Deletar Service/Professional (gera `service.deleted.v1` / `professional.deleted.v1`)
   - Verificar eventos na outbox
   - Sincronizar com Hub
   - Verificar dados no Hub

2. **Isolamento por Tenant**
   - Criar dados em tenants diferentes
   - Verificar que cada tenant vê apenas seus dados
   - Testar políticas RLS

3. **Sincronização**
   - Testar push de eventos (`service.upserted.v1`, `service.deleted.v1`)
   - Verificar processamento no Hub
   - Validar integridade dos dados
   - Testar idempotência dos eventos `upserted`

## Monitoramento

### Logs
- Eventos de sincronização são logados
- Erros de processamento são capturados
- Métricas de performance disponíveis

### Métricas
- Número de eventos processados
- Tempo de processamento
- Taxa de erro por tipo de evento

## Troubleshooting

### Problemas Comuns

1. **Eventos não sincronizando**
   - Verificar conectividade entre Client Local e Hub
   - Validar autenticação e autorização
   - Checar logs de erro

2. **Dados duplicados**
   - Verificar se eventos estão sendo processados múltiplas vezes
   - Validar idempotência dos processadores

3. **Isolamento de tenant quebrado**
   - Verificar se `tenantId` está sendo definido corretamente
   - Validar políticas RLS no banco

### Comandos Úteis

```bash
# Verificar eventos pendentes no Client Local
GET /sync/events

# Forçar sincronização
POST /sync/push/pending

# Testar sincronização completa
GET /sync/test
```

## Próximos Passos

1. Implementar processamento de comandos no Client Local (se necessário)
2. Adicionar métricas de monitoramento
3. Implementar retry automático para falhas de sincronização
4. Adicionar validação de schema nos eventos