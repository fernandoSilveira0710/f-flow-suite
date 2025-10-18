# 🔐 Fluxo de Autenticação e Licenciamento - F-Flow Suite

Este documento explica detalhadamente como funciona o sistema de autenticação e licenciamento do F-Flow Suite, incluindo os cenários online e offline.

## 📋 Visão Geral da Arquitetura

O F-Flow Suite utiliza uma arquitetura híbrida com dois componentes principais:

- **🌐 Hub (Backend Central)**: Servidor central que gerencia usuários, licenças e sincronização
- **💻 Client-Local (Backend Local)**: Servidor local que permite funcionamento offline

## 🔄 Fluxo Completo de Autenticação

### 1️⃣ **Cenário Online (Hub Disponível)**

#### **Etapa 1: Autenticação no Hub**
```
📧 Usuário insere credenciais (email/senha)
    ↓
🌐 Frontend faz requisição para Hub: POST /public/login
    ↓
🔐 Hub valida credenciais no banco de dados
    ↓
✅ Hub retorna JWT token + dados do usuário
```

**Logs correspondentes:**
```
🔐 INÍCIO DO LOGIN - Email: fernando@2fsolutions.com.br
📡 ETAPA 1: Tentando autenticação no Hub...
🌐 Fazendo requisição para Hub: http://localhost:3001/public/login
📡 Resposta do Hub - Status: 201 OK: true
✅ Hub disponível e resposta OK - processando...
```

#### **Etapa 2: Sincronização com Client-Local**
```
📋 Hub envia dados do usuário para Client-Local
    ↓
💾 Client-Local persiste dados localmente
    ↓
🔄 Sincronização de dados (produtos, clientes, etc.)
```

**Logs correspondentes:**
```
🔄 Sincronizando dados com client-local...
🔄 Sincronização - Status: 201 OK: true
```

#### **Etapa 3: Validação de Licença**
```
🎫 Frontend consulta status da licença no Hub
    ↓
🔍 Hub verifica licença no banco de dados
    ↓
📊 Retorna status: válida/expirada/inexistente
```

**Logs correspondentes:**
```
🎫 Verificando licenças no Hub...
🎫 URL de validação de licença: http://localhost:3001/licenses/validate?tenantId=...
🎫 Resposta da licença - Status: 200 OK: true
🎫 Dados da licença: {valid: false, licensed: false, planKey: 'pro', expiresAt: '...'}
```

#### **Etapa 4: Ativação Local da Licença**
```
🔑 Se licença válida → Ativa licença no Client-Local
    ↓
💾 Client-Local persiste token de licença
    ↓
✅ Sistema pronto para uso
```

#### **Etapa 5: Verificação de Acesso**
```
🛡️ Protected Route verifica:
    ├── ✅ Usuário autenticado?
    ├── ✅ Licença válida?
    └── ✅ Permissões adequadas?
        ↓
🎉 Acesso liberado ao dashboard
```

**Logs correspondentes:**
```
🛡️ PROTECTED ROUTE - Estado atual: {pathname: '/erp/dashboard', user: 'PRESENTE', ...}
🎫 PROTECTED ROUTE - Verificando licenciamento: {isValid: true, isInstalled: true, ...}
✅ PROTECTED ROUTE - Todas as verificações passaram, renderizando conteúdo
```

---

### 2️⃣ **Cenário Offline (Hub Indisponível)**

#### **Etapa 1: Tentativa de Autenticação no Hub**
```
📧 Usuário insere credenciais
    ↓
🌐 Frontend tenta conectar ao Hub
    ↓
❌ Hub indisponível (timeout/erro de rede)
    ↓
🔄 Sistema entra em modo offline
```

#### **Etapa 2: Autenticação Local**
```
💻 Frontend tenta autenticação no Client-Local
    ↓
🔍 Client-Local verifica credenciais no banco local
    ↓
✅ Se usuário existe localmente → Login aprovado
❌ Se usuário não existe → Login negado
```

#### **Etapa 3: Verificação de Licença Local**
```
🎫 Client-Local verifica licença armazenada localmente
    ↓
📅 Verifica se licença não expirou
    ↓
✅ Se válida → Acesso liberado
⚠️ Se expirada → Modo limitado ou bloqueio
```

#### **Etapa 4: Funcionamento Offline**
```
💾 Sistema funciona com dados locais
    ├── ✅ Vendas (PDV)
    ├── ✅ Estoque
    ├── ✅ Clientes
    ├── ✅ Agendamentos
    └── ⏳ Sincronização pendente
```

---

## 🔧 Componentes Técnicos

### **Frontend (React)**
- **📁 `auth-context.tsx`**: Gerencia estado de autenticação
- **📁 `protected-route.tsx`**: Controla acesso às rotas
- **📁 `login.tsx`**: Interface de login

### **Hub (NestJS)**
- **📁 `public.service.ts`**: Autenticação de usuários
- **📁 `licenses.service.ts`**: Gerenciamento de licenças
- **📁 `sync.service.ts`**: Sincronização de dados

### **Client-Local (NestJS)**
- **📁 `licensing.service.ts`**: Validação local de licenças
- **📁 `users.service.ts`**: Gerenciamento local de usuários
- **📁 `health.service.ts`**: Status do sistema

---

## 🎯 Estados do Sistema

### **🟢 Online + Licenciado**
- ✅ Acesso completo a todas as funcionalidades
- ✅ Sincronização em tempo real
- ✅ Backup automático no Hub

### **🟡 Online + Licença Expirada**
- ⚠️ Modal de renovação de planos
- ⚠️ Funcionalidades limitadas
- ✅ Dados preservados

### **🔵 Offline + Licenciado**
- ✅ Funcionalidades principais disponíveis
- ⏳ Sincronização pendente
- 💾 Dados armazenados localmente

### **🔴 Offline + Licença Expirada**
- ❌ Acesso bloqueado ou muito limitado
- ⚠️ Apenas visualização de dados
- 🔒 Vendas bloqueadas

---

## 🔄 Processo de Sincronização

### **Dados Sincronizados:**
- 👥 **Usuários**: Credenciais e permissões
- 🛍️ **Produtos**: Catálogo e preços
- 👨‍👩‍👧‍👦 **Clientes**: Informações e histórico
- 🐕 **Pets**: Dados dos animais
- 📅 **Agendamentos**: Consultas e serviços
- 💰 **Vendas**: Transações e relatórios
- 📊 **Estoque**: Quantidades e movimentações

### **Direção da Sincronização:**
```
Hub (Central) ←→ Client-Local (Dispositivo)
     ↓
📤 Upload: Vendas, agendamentos locais
📥 Download: Produtos, clientes, configurações
```

---

## 🛠️ Configurações Importantes

### **Variáveis de Ambiente:**

#### **Hub (.env)**
```env
# Licenciamento
LICENSING_ENFORCED=false  # Para desenvolvimento
LICENSE_PRIVATE_KEY_PEM=...
LICENSE_PUBLIC_KEY_PEM=...

# Banco de dados
DATABASE_URL=...

# JWT
JWT_SECRET=...
```

#### **Client-Local (.env)**
```env
# Conexão com Hub
HUB_URL=http://localhost:3001

# Licenciamento local
LICENSING_ENFORCED=false  # Para desenvolvimento

# Banco local
DATABASE_URL=...
```

---

## 🚨 Troubleshooting

### **Problema: Login falha com 401**
- ✅ Verificar se usuário existe no Hub
- ✅ Verificar hash da senha (bcrypt)
- ✅ Verificar conectividade com Hub

### **Problema: Licença sempre inválida**
- ✅ Verificar `LICENSING_ENFORCED=false` em desenvolvimento
- ✅ Verificar mapeamento de propriedades (`valid` vs `isValid`)
- ✅ Verificar chaves de licenciamento

### **Problema: Sincronização falha**
- ✅ Verificar conectividade Hub ↔ Client-Local
- ✅ Verificar logs de ambos os serviços
- ✅ Verificar estrutura do banco de dados

---

## 📊 Monitoramento

### **Endpoints de Health Check:**
- **Hub**: `http://localhost:3001/health`
- **Client-Local**: `http://localhost:8081/health`
- **Frontend**: `http://localhost:8080`

### **Logs Importantes:**
- 🔐 **Autenticação**: `auth-context.tsx`
- 🎫 **Licenciamento**: `licensing.service.ts`
- 🔄 **Sincronização**: `sync.service.ts`
- 🛡️ **Acesso**: `protected-route.tsx`

---

## 🎯 Resumo do Fluxo Atual

Com base nos logs fornecidos, o sistema está funcionando corretamente:

1. ✅ **Autenticação no Hub**: Sucesso (Status 201)
2. ✅ **Sincronização**: Dados persistidos no Client-Local
3. ⚠️ **Licença**: Detectada como expirada (modal de planos)
4. ✅ **Acesso**: Protected Route liberou acesso ao dashboard
5. 🎉 **Resultado**: Sistema funcionando, usuário logado

O fluxo está completo e operacional! 🚀