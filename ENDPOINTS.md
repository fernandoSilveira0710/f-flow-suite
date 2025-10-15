# F-Flow Suite - Documentação de Endpoints

Este documento lista todos os endpoints e portas dos serviços do F-Flow Suite.

## 🌐 Visão Geral dos Serviços

| Serviço | Porta | URL Base | Descrição |
| ------- | ----- | -------- | --------- |
| **Frontend ERP** | 8080 | http://localhost:8080 | Interface web do ERP |
| **Site Institucional** | 5173 | http://localhost:5173 | Site institucional (cadastro, planos) |
| **Hub API** | 8081 | http://localhost:8081 | API central (licenças, auth) |
| **Client-Local API** | 3001 | http://localhost:3001 | API local (POS, estoque) |
| **Prisma Studio HUB** | 5555 | http://localhost:5555 | Interface do banco HUB |
| **Prisma Studio Local** | 5556 | http://localhost:5556 | Interface do banco local |
| **PostgreSQL** | 5432 | localhost:5432 | Banco de dados principal |

## 🎯 Frontend ERP (Porta 8080)

### Rotas Públicas
- `GET /erp/login` - **Login principal do ERP**

### Rotas Protegidas (ERP)
- `GET /erp/dashboard` - Dashboard principal
- `GET /erp/pos` - Sistema POS
- `GET /erp/inventory` - Gestão de estoque
- `GET /erp/grooming` - Sistema de grooming
- `GET /erp/settings` - Configurações

## 🏢 Hub API (Porta 8081)

### Endpoints Públicos
- `GET /health` - Status da API
- `POST /public/login` - **Autenticação de usuários**
- `GET /.well-known/jwks.json` - Chaves públicas JWKS

### Endpoints Protegidos
- `GET /tenants` - Listar tenants
- `POST /tenants` - Criar tenant
- `GET /licenses` - Listar licenças
- `POST /licenses` - Criar licença
- `GET /users` - Listar usuários
- `POST /users` - Criar usuário

### Exemplo de Login
```bash
curl -X POST http://localhost:8081/public/login \
  -H "Content-Type: application/json" \
  -d '{"email": "logintest@2fsolutions.com.br", "password": "123456"}'
```

## 🏪 Client-Local API (Porta 3001)

### Endpoints de Sistema
- `GET /health` - Status da API
- `GET /users/has-users` - **Verifica usuários cadastrados**
- `POST /users/sync` - Sincronização com HUB

### Endpoints de Autenticação Offline
- `POST /auth/offline-login` - **Autenticação offline quando Hub indisponível**

### Endpoints POS
- `GET /pos/sales` - Listar vendas
- `POST /pos/sales` - Criar venda
- `GET /pos/products` - Produtos para venda

### Endpoints Estoque
- `GET /inventory/products` - Listar produtos
- `POST /inventory/products` - Criar produto
- `PUT /inventory/products/:id` - Atualizar produto
- `DELETE /inventory/products/:id` - Remover produto

### Endpoints Grooming
- `GET /grooming/appointments` - Listar agendamentos
- `POST /grooming/appointments` - Criar agendamento
- `PUT /grooming/appointments/:id` - Atualizar agendamento

### Endpoints Sincronização
- `GET /sync/status` - Status da sincronização
- `POST /sync/force` - Forçar sincronização

### Exemplo de Verificação
```bash
curl http://localhost:3001/users/has-users
```

### Exemplo de Autenticação Offline
```bash
# Autenticação offline (quando Hub indisponível)
curl -X POST http://localhost:3001/auth/offline-login \
  -H "Content-Type: application/json" \
  -d '{"email": "logintest@2fsolutions.com.br", "password": "123456"}'
```

## 🗄️ Prisma Studio

### HUB Database (Porta 5555)
- **URL**: http://localhost:5555
- **Banco**: PostgreSQL
- **Tabelas**: User, Tenant, License, etc.

### Client-Local Database (Porta 5556)
- **URL**: http://localhost:5556
- **Banco**: SQLite
- **Tabelas**: Product, Sale, Appointment, etc.

## 👥 Usuários de Teste

Todos os usuários abaixo estão cadastrados no HUB (localhost:5555):

1. **Admin Principal**
   - Email: `luisfernando@email.com`
   - Senha: `123456`

2. **Usuário de Teste**
   - Email: `teste@exemplo.com`
   - Senha: `123456`

3. **Login de Teste**
   - Email: `logintest@2fsolutions.com.br`
   - Senha: `123456`

4. **Terceiro Usuário**
   - Email: `terceiro@exemplo.com`
   - Senha: `123456`

## 🔄 Fluxo de Autenticação

### Modo Online (Hub + Client-Local)
1. **Login no ERP**: http://localhost:8080/erp/login
2. **Autenticação via HUB**: POST http://localhost:8081/public/login
3. **Sincronização Local**: POST http://localhost:3001/users/sync
4. **Redirecionamento**: http://localhost:8080/erp/dashboard

### Modo Offline (Client-Local apenas)
1. **Login no ERP**: http://localhost:8080/erp/login
2. **Detecção de Hub indisponível**: Timeout/erro de conexão
3. **Autenticação offline**: POST http://localhost:3001/auth/offline-login
4. **Validação local**: Cache de usuários + licença offline
5. **Redirecionamento**: http://localhost:8080/erp/dashboard

## 🛠️ Comandos de Teste

### Verificar Status dos Serviços
```bash
# Hub API
curl http://localhost:8081/health

# Client-Local API
curl http://localhost:3001/health

# Frontend (deve retornar HTML)
curl http://localhost:8080/erp/login
```

### Testar Autenticação
```bash
# Login via HUB (modo online)
curl -X POST http://localhost:8081/public/login \
  -H "Content-Type: application/json" \
  -d '{"email": "logintest@2fsolutions.com.br", "password": "123456"}'

# Login offline (quando Hub indisponível)
curl -X POST http://localhost:3001/auth/offline-login \
  -H "Content-Type: application/json" \
  -d '{"email": "logintest@2fsolutions.com.br", "password": "123456"}'

# Verificar usuários locais
curl http://localhost:3001/users/has-users
```

## 📝 Notas Importantes

- **Porta Principal do ERP**: 8080 (não 5173)
- **Autenticação Real**: Via HUB na porta 8081
- **Sincronização**: Automática entre HUB e Client-Local
- **Prisma Studio**: Duas instâncias (HUB e Local)
- **Banco Local**: SQLite gerenciado automaticamente