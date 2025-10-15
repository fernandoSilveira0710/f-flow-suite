# F-Flow Suite - Fluxos de Autenticação

Este documento ilustra os fluxos de autenticação do F-Flow Suite em modo online e offline.

## 🌐 Fluxo Online (Hub + Client-Local)

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Frontend  │    │     Hub     │    │ Client-Local│    │  Dashboard  │
│   (8080)    │    │   (8081)    │    │   (3001)    │    │   (8080)    │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
       │ 1. POST /login    │                   │                   │
       │ {email, password} │                   │                   │
       ├──────────────────►│                   │                   │
       │                   │                   │                   │
       │ 2. Validate user  │                   │                   │
       │    & license      │                   │                   │
       │                   │                   │                   │
       │ 3. Return token   │                   │                   │
       │    & user data    │                   │                   │
       │◄──────────────────┤                   │                   │
       │                   │                   │                   │
       │ 4. POST /users/sync                   │                   │
       │    {token, user}  │                   │                   │
       ├──────────────────────────────────────►│                   │
       │                   │                   │                   │
       │                   │                   │ 5. Cache user     │
       │                   │                   │    & license      │
       │                   │                   │                   │
       │ 6. Sync success   │                   │                   │
       │◄──────────────────────────────────────┤                   │
       │                   │                   │                   │
       │ 7. Redirect to dashboard              │                   │
       ├──────────────────────────────────────────────────────────►│
       │                   │                   │                   │
```

### Características do Fluxo Online:
- ✅ Autenticação em tempo real via Hub
- ✅ Validação de licença ativa
- ✅ Sincronização automática de dados
- ✅ Acesso a todos os recursos
- ⚠️ Requer conexão com internet

## 🔌 Fluxo Offline (Client-Local apenas)

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Frontend  │    │     Hub     │    │ Client-Local│    │  Dashboard  │
│   (8080)    │    │   (8081)    │    │   (3001)    │    │   (8080)    │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
       │ 1. POST /login    │                   │                   │
       │ {email, password} │                   │                   │
       ├──────────────────►│                   │                   │
       │                   │                   │                   │
       │ 2. Connection     │                   │                   │
       │    timeout/error  │                   │                   │
       │◄──────────────────┤                   │                   │
       │                   ❌                  │                   │
       │                                       │                   │
       │ 3. POST /auth/offline-login           │                   │
       │    {email, password}                  │                   │
       ├──────────────────────────────────────►│                   │
       │                                       │                   │
       │                                       │ 4. Validate user  │
       │                                       │    from cache     │
       │                                       │                   │
       │                                       │ 5. Validate       │
       │                                       │    offline license│
       │                                       │                   │
       │ 6. Return user data                   │                   │
       │    & offline token                    │                   │
       │◄──────────────────────────────────────┤                   │
       │                                       │                   │
       │ 7. Redirect to dashboard              │                   │
       ├──────────────────────────────────────────────────────────►│
       │                                       │                   │
```

### Características do Fluxo Offline:
- ✅ Funciona sem conexão com internet
- ✅ Usa cache local de usuários
- ✅ Valida licença offline (JWKS)
- ✅ Acesso a recursos locais
- ⚠️ Dados limitados ao cache local
- ⚠️ Sem sincronização em tempo real

## 🔄 Sincronização e Cache

### Preparação para Modo Offline

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│     Hub     │    │ Client-Local│    │   Cache     │
│   (8081)    │    │   (3001)    │    │  (SQLite)   │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       │ 1. GET /.well-known/jwks.json         │
       │◄──────────────────┤                   │
       │                   │                   │
       │ 2. Download JWKS  │                   │
       │   public key      │                   │
       ├──────────────────►│                   │
       │                   │                   │
       │                   │ 3. Store JWKS    │
       │                   ├──────────────────►│
       │                   │                   │
       │ 4. GET /users     │                   │
       │   (with x-tenant-id)                  │
       │◄──────────────────┤                   │
       │                   │                   │
       │ 5. Return users   │                   │
       │   & licenses      │                   │
       ├──────────────────►│                   │
       │                   │                   │
       │                   │ 6. Cache users   │
       │                   │   & licenses     │
       │                   ├──────────────────►│
       │                   │                   │
```

## 🛡️ Segurança

### Validação de Licença Offline

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Client-Local│    │   License   │    │    JWKS     │
│             │    │   Token     │    │ Public Key  │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       │ 1. Read license   │                   │
       │    from cache     │                   │
       ├──────────────────►│                   │
       │                   │                   │
       │ 2. Extract JWT    │                   │
       │    signature      │                   │
       │◄──────────────────┤                   │
       │                   │                   │
       │ 3. Load JWKS      │                   │
       │    public key     │                   │
       ├──────────────────────────────────────►│
       │                   │                   │
       │ 4. Verify JWT     │                   │
       │    signature      │                   │
       │◄──────────────────────────────────────┤
       │                   │                   │
       │ 5. Check expiry   │                   │
       │    & validity     │                   │
       ├──────────────────►│                   │
       │                   │                   │
       │ 6. License valid  │                   │
       │    ✅ or ❌       │                   │
       │◄──────────────────┤                   │
       │                   │                   │
```

## 📋 Requisitos por Modo

### Modo Online
- ✅ Conexão com internet
- ✅ Hub rodando (porta 8081)
- ✅ Client-Local rodando (porta 3001)
- ✅ Frontend rodando (porta 8080)
- ✅ Usuário cadastrado no Hub
- ✅ Licença ativa no Hub

### Modo Offline
- ✅ Client-Local rodando (porta 3001)
- ✅ Frontend rodando (porta 8080)
- ✅ Cache de usuários sincronizado
- ✅ Licença offline válida
- ✅ Chave pública JWKS baixada
- ❌ Conexão com internet (opcional)
- ❌ Hub rodando (não necessário)

## 🔧 Configuração

### Variáveis de Ambiente

#### Hub (.env)
```bash
LICENSE_PRIVATE_KEY_PEM=-----BEGIN PRIVATE KEY-----...
LICENSE_PUBLIC_KEY_PEM=-----BEGIN PUBLIC KEY-----...
```

#### Client-Local (.env)
```bash
HUB_API_URL=http://localhost:8081
LOCAL_SERVER_ENABLED=true
OFFLINE_MODE_ENABLED=true
```

#### Frontend (.env)
```bash
VITE_HUB_API_URL=http://localhost:8081
VITE_CLIENT_LOCAL_API_URL=http://localhost:3001
```

## 🧪 Testes

### Testar Modo Online
```bash
# 1. Verificar Hub
curl http://localhost:8081/health

# 2. Testar login
curl -X POST http://localhost:8081/public/login \
  -H "Content-Type: application/json" \
  -d '{"email": "teste@exemplo.com", "password": "123456"}'
```

### Testar Modo Offline
```bash
# 1. Parar o Hub
# 2. Testar login offline
curl -X POST http://localhost:3001/auth/offline-login \
  -H "Content-Type: application/json" \
  -d '{"email": "teste@exemplo.com", "password": "123456"}'
```

### Simular Falha de Conexão
```bash
# Bloquear porta do Hub temporariamente
# Windows: netsh advfirewall firewall add rule name="Block Hub" dir=in action=block protocol=TCP localport=8081
# Linux/Mac: sudo iptables -A INPUT -p tcp --dport 8081 -j DROP
```