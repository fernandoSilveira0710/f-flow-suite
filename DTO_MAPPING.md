# Mapeamento DTO Frontend → Modelo Banco de Dados

## 1. Configuration (Configurações)

### Frontend Mock (settings-api.ts)
```typescript
// Não há DTO específico, mas há interfaces de preferências:
interface PosPrefs {
  impressora: 'nenhuma' | 'termica' | 'a4';
  reciboAuto: boolean;
  abrirGaveta: boolean;
}

interface AgendaPrefs {
  intervaloPadraoMin: number;
  permitirDuploAgendamento: boolean;
}

interface PetPrefs {
  banhoDuracaoMin: number;
  tosaDuracaoMin: number;
  pedirAssinaturaTermo?: boolean;
}

interface StockPrefs {
  estoqueMinimoPadrao?: number;
  bloquearVendaSemEstoque?: boolean;
}
```

### Backend DTO (configuration.dto.ts)
```typescript
export class CreateConfigurationDto {
  key: string;           // ✅ Mapeado
  value: string;         // ✅ Mapeado
  category?: string;     // ✅ Mapeado (default: 'general')
  type?: string;         // ✅ Mapeado (default: 'string')
  description?: string;  // ✅ Mapeado
}
```

### Modelo Banco (schema.prisma)
```prisma
model Configuration {
  id          String   @id @default(uuid())     // ✅ Auto-gerado
  key         String   @unique                  // ✅ Mapeado
  value       String                            // ✅ Mapeado
  category    String   @default("general")      // ✅ Mapeado
  type        String   @default("string")       // ✅ Mapeado
  description String?                           // ✅ Mapeado
  createdAt   DateTime @default(now())          // ✅ Auto-gerado
  updatedAt   DateTime @updatedAt               // ✅ Auto-gerado
}
```

### ✅ Status: COMPLETO - Todos os campos mapeados

---

## 2. Grooming (Banho & Tosa)

### Frontend Mock (grooming-api.ts)
```typescript
interface Tutor {
  id: string;
  clienteId?: string;    // FK para Cliente da Agenda
  nome: string;
  telefone: string;
  email?: string;
  documento?: string;
  endereco?: string;
  notas?: string;
  ativo: boolean;
}

interface Pet {
  id: string;
  tutorId: string;
  nome: string;
  especie: Especie;      // 'CACHORRO' | 'GATO'
  raca?: string;
  porte: Porte;          // 'PP' | 'P' | 'M' | 'G' | 'GG'
  tipoPelo: TipoPelo;    // 'CURTO' | 'MEDIO' | 'LONGO' | 'DUAS_CAMADAS' | 'POODLE'
  idadeMeses?: number;
  pesoKg?: number;
  temperamento: Temperamento; // 'DOCIL' | 'REATIVO' | 'AGRESSIVO' | 'ANSIOSO' | 'DESCONHECIDO'
  alergias?: string;
  restricoes?: string;
  ultimaVacinaAntirrabica?: string;
  antipulgasEm?: string;
  observacoes?: string;
  fotos?: string[];
  ativo: boolean;
}

interface GroomService {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration: number;
  category: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface GroomTicket {
  id: string;
  codigo: string;
  petId: string;
  tutorId: string;
  servicos: string[];    // Array de IDs de serviços
  status: TicketStatus;  // 'AGENDADO' | 'RECEBIDO' | 'EM_ANDAMENTO' | 'PRONTO' | 'ENTREGUE' | 'CANCELADO'
  dataAgendamento: string;
  dataRecebimento?: string;
  dataFinalizacao?: string;
  observacoes?: string;
  valorTotal: number;
  desconto?: number;
  formaPagamento?: string;
  criadoEm: string;
  atualizadoEm: string;
}
```

### Backend Schema (Precisa ser criado)
```prisma
model GroomingTicket {
  id              String   @id @default(uuid())
  codigo          String   @unique
  petId           String
  tutorId         String
  status          String   // AGENDADO, RECEBIDO, EM_ANDAMENTO, PRONTO, ENTREGUE, CANCELADO
  dataAgendamento DateTime
  dataRecebimento DateTime?
  dataFinalizacao DateTime?
  observacoes     String?
  valorTotal      Decimal  @db.Decimal(10,2)
  desconto        Decimal? @db.Decimal(10,2)
  formaPagamento  String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Relacionamentos
  items           GroomingItem[]
}

model GroomingItem {
  id        String @id @default(uuid())
  ticketId  String
  serviceId String
  quantity  Int    @default(1)
  price     Decimal @db.Decimal(10,2)
  
  // Relacionamentos
  ticket    GroomingTicket @relation(fields: [ticketId], references: [id])
}
```

### ❌ Status: INCOMPLETO - Modelos de grooming não existem no schema

---

## 3. Dashboard (Métricas)

### Frontend Mock (mock-data.ts)
```typescript
interface DashboardKPI {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
}

// Mock KPIs
getDashboardKPIs: (): DashboardKPI[] => [
  {
    label: 'Faturamento Hoje',
    value: 'R$ 2.845,00',
    change: '+12%',
    trend: 'up',
  },
  {
    label: 'Ticket Médio',
    value: 'R$ 142,25',
    change: '+5%',
    trend: 'up',
  },
  {
    label: 'Vendas do Dia',
    value: '20',
    change: '-3%',
    trend: 'down',
  },
  {
    label: 'Produtos Ativos',
    value: String(mockProducts.filter(p => p.active).length),
    change: '+2',
    trend: 'up',
  },
]
```

### Backend Response (Precisa ser criado)
```typescript
interface DashboardSummaryDto {
  vendas: {
    totalDia: number;
    totalMes: number;
    ticketMedio: number;
    quantidadeDia: number;
  };
  estoque: {
    produtosBaixoEstoque: number;
    valorTotalEstoque: number;
  };
  agendamentos: {
    totalDia: number;
    abertos: number;
    emAndamento: number;
    concluidos: number;
  };
}
```

### ❌ Status: INCOMPLETO - Endpoint /dashboard/summary não existe

---

## 4. Products (Produtos)

### Frontend Mock (mock-data.ts)
```typescript
interface Product {
  id: string;
  name: string;
  description: string;
  sku: string;
  barcode: string;
  categoryId: string;
  price: number;
  cost: number;
  stock: number;
  active: boolean;
  imageUrl?: string;
  gallery?: string[];
  createdAt: string;
  updatedAt: string;
}
```

### Backend Schema (Existente)
```prisma
model Product {
  id          String   @id @default(uuid())
  name        String
  description String?
  sku         String   @unique
  barcode     String?
  categoryId  String?
  price       Decimal  @db.Decimal(10,2)
  cost        Decimal? @db.Decimal(10,2)
  stockQty    Int      @default(0)
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### ✅ Status: COMPLETO - Mapeamento existente (stock → stockQty)

---

## 5. Appointments (Agendamentos)

### Frontend Mock (schedule-api.ts)
```typescript
interface Service {
  id: string;
  nome: string;
  descricao?: string;
  categoria: string;
  duracaoMin: number;
  precoBase: number;
  bufferAntesMin?: number;
  bufferDepoisMin?: number;
  cor?: string;
  ativo: boolean;
  createdAtISO?: string;
}
```

### Backend Schema (Existente)
```prisma
model Appointment {
  id             String    @id @default(uuid())
  customerId     String?
  petId          String?
  serviceId      String?
  professionalId String?
  resourceId     String?
  date           DateTime
  startTime      DateTime?
  endTime        DateTime?
  duration       Int
  status         String    @default("scheduled")
  notes          String?
  price          Decimal?  @db.Decimal(10,2)
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
}
```

### ✅ Status: COMPLETO - Mapeamento existente

---

## Resumo de Pendências

### ❌ FALTANDO:
1. **Modelos Grooming**: GroomingTicket, GroomingItem
2. **Endpoint Dashboard**: /dashboard/summary
3. **DTOs Grooming**: CreateGroomingTicketDto, UpdateGroomingTicketDto
4. **Validações**: Schemas Ajv para eventos de grooming

### ✅ COMPLETOS:
1. **Configuration**: Modelo e DTOs existem
2. **Products**: Mapeamento completo
3. **Appointments**: Mapeamento completo
4. **Customers/Pets**: Mapeamento completo

### 🔄 PRÓXIMOS PASSOS:
1. Criar modelos de grooming no schema
2. Implementar endpoint /dashboard/summary
3. Criar DTOs de grooming
4. Atualizar SyncAgent para novos eventos
5. Implementar flags de recurso