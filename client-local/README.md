# F-Flow Client Local

O **F-Flow Client Local** é um executável multiplataforma que fornece uma API local para o F-Flow Suite, incorporando um banco SQLite e executando migrations automáticas.

## 🚀 Funcionalidades

- **Executável Multiplataforma**: Binários para Windows, macOS e Linux
- **Banco SQLite Embutido**: Database local com migrations automáticas
- **Paths por SO**: Resolve automaticamente diretórios de dados e logs conforme o sistema operacional
- **Servidor NestJS**: API REST em `127.0.0.1:3001`
- **Instalação como Serviço**: Pode ser instalado como serviço do sistema operacional
- **Logs Estruturados**: Logs em JSON com rotação diária
- **Configuração Flexível**: Suporte a variáveis de ambiente e configuração automática

## 📁 Estrutura de Diretórios

### Windows
```
%LOCALAPPDATA%/F-Flow Suite/
├── data/
│   └── local.db
└── logs/
    └── f-flow-client.log
```

### macOS
```
~/Library/Application Support/F-Flow Suite/
├── data/
│   └── local.db
└── logs/
    └── f-flow-client.log
```

### Linux
```
~/.local/share/f-flow-suite/
├── data/
│   └── local.db
└── logs/
    └── f-flow-client.log
```

## 🛠️ Desenvolvimento

### Pré-requisitos

- Node.js 18+
- npm ou yarn

### Instalação

```bash
npm install
```

### Executar em Desenvolvimento

```bash
npm run start:dev
```

### Build TypeScript

```bash
npm run build
```

### Gerar Executáveis

```bash
# Gera binários para todas as plataformas
npm run build:pkg

# Os executáveis serão criados em:
# - build/f-flow-client-win.exe (Windows)
# - build/f-flow-client-macos (macOS)
# - build/f-flow-client-linux (Linux)
```

## 🔧 Configuração

### Variáveis de Ambiente

Copie `.env.example` para `.env` e configure:

```bash
# Servidor Local
LOCAL_SERVER_ENABLED=true
PORT=3001

# Paths Customizados (opcional)
LOCAL_DATA_DIR=/custom/data/path
LOCAL_LOG_DIR=/custom/logs/path

# Database
DATABASE_URL="file:./local.db"

# Hub Integration
HUB_BASE_URL=http://localhost:3000

# Licenciamento
LICENSE_FILE=./license.jwt
LICENSE_PUBLIC_KEY_PEM="-----BEGIN PUBLIC KEY-----..."
```

### Configurações Importantes

- **LOCAL_SERVER_ENABLED**: Se `false`, o servidor não inicia
- **LOCAL_DATA_DIR**: Diretório customizado para dados (opcional)
- **LOCAL_LOG_DIR**: Diretório customizado para logs (opcional)

## 📦 Instalação como Serviço

### Windows

```powershell
# Executar como Administrador
cd installers
.\install-windows.ps1

# Desinstalar
.\uninstall-windows.ps1
```

### macOS

```bash
cd installers
./install-macos.sh

# Desinstalar
./uninstall-macos.sh
```

### Linux

```bash
cd installers

# Instalação como serviço do sistema (requer sudo)
sudo ./install-linux.sh

# Ou instalação como serviço do usuário
./install-linux.sh --user

# Desinstalar
sudo ./uninstall-linux.sh
# ou
./uninstall-linux.sh --user
```

## 🔍 Gerenciamento do Serviço

### Windows

```powershell
# Verificar status
Get-Service F-Flow-Client-Local

# Iniciar/Parar
Start-Service F-Flow-Client-Local
Stop-Service F-Flow-Client-Local

# Logs do Windows Event Viewer
```

### macOS

```bash
# Verificar status
launchctl list | grep f-flow

# Iniciar/Parar
launchctl start com.f-flow.client-local
launchctl stop com.f-flow.client-local

# Logs
tail -f ~/Library/Logs/f-flow-client-local.log
```

### Linux

```bash
# Serviço do sistema
sudo systemctl status f-flow-client-local
sudo systemctl start f-flow-client-local
sudo systemctl stop f-flow-client-local
sudo journalctl -u f-flow-client-local -f

# Serviço do usuário
systemctl --user status f-flow-client-local
systemctl --user start f-flow-client-local
systemctl --user stop f-flow-client-local
journalctl --user -u f-flow-client-local -f
```

## 🧪 Testes

```bash
# Executar testes
npm test

# Testes em modo watch
npm run test:watch

# Testes com coverage
npm run test:cov
```

## 📊 Logs

Os logs são estruturados em formato JSON e incluem:

```json
{
  "level": "info",
  "time": "2024-01-01T12:00:00.000Z",
  "service": "f-flow-client-local",
  "context": "Bootstrap",
  "message": "Server started on http://127.0.0.1:3001",
  "requestId": "abc123"
}
```

### Rotação de Logs

- **Rotação**: Diária
- **Retenção**: 30 dias
- **Compressão**: Logs antigos são comprimidos com gzip

## 🔌 API Endpoints

### Health Check

```bash
GET http://127.0.0.1:3001/health
```

Resposta:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 3600
}
```

### Health Dependencies

```bash
GET http://127.0.0.1:3001/health/deps
```

Resposta:
```json
{
  "sqlite": {
    "status": "connected",
    "responseTime": 2
  },
  "hub": {
    "status": "connected",
    "responseTime": 150
  }
}
```

### Dashboard

```bash
GET http://127.0.0.1:3001/dashboard/summary
```

Resposta:
```json
{
  "vendas": {
    "hoje": 0,
    "semana": 0,
    "mes": 0
  },
  "estoque": {
    "produtosAtivos": 0,
    "estoqueTotal": 0,
    "alertasBaixoEstoque": 0
  },
  "agendamentos": {
    "hoje": 0,
    "semana": 0,
    "pendentes": 0
  },
  "grooming": {
    "agendamentosHoje": 0,
    "servicosAtivos": 0,
    "faturamentoMes": 0
  }
}
```

### Feature Flags

```bash
# Obter todas as feature flags
GET http://127.0.0.1:3001/feature-flags

# Verificar feature específica
GET http://127.0.0.1:3001/feature-flags/pos
GET http://127.0.0.1:3001/feature-flags/grooming
GET http://127.0.0.1:3001/feature-flags/appointments
GET http://127.0.0.1:3001/feature-flags/inventory
GET http://127.0.0.1:3001/feature-flags/customers
GET http://127.0.0.1:3001/feature-flags/reports
```

Resposta (todas as flags):
```json
{
  "mvpPosEnabled": true,
  "mvpGroomingEnabled": true,
  "mvpAppointmentsEnabled": true,
  "mvpInventoryEnabled": true,
  "mvpCustomersEnabled": true,
  "mvpReportsEnabled": true
}
```

Resposta (feature específica):
```json
{
  "enabled": true
}
```

## 🚨 Troubleshooting

### Problemas Comuns

#### 1. Serviço não inicia

**Windows:**
```powershell
# Verificar logs do Event Viewer
Get-EventLog -LogName Application -Source "F-Flow-Client-Local" -Newest 10
```

**Linux/macOS:**
```bash
# Verificar logs do serviço
journalctl -u f-flow-client-local --no-pager
```

#### 2. Porta já em uso

```bash
# Verificar processo usando a porta 3001
netstat -tulpn | grep 3001  # Linux
netstat -an | findstr 3001  # Windows
lsof -i :3001              # macOS
```

#### 3. Permissões de diretório

```bash
# Linux/macOS - corrigir permissões
chmod 755 ~/.local/share/f-flow-suite
chmod 644 ~/.local/share/f-flow-suite/data/local.db
```

#### 4. Database locked

```bash
# Parar o serviço antes de acessar o banco
sudo systemctl stop f-flow-client-local  # Linux
Stop-Service F-Flow-Client-Local          # Windows
launchctl stop com.f-flow.client-local   # macOS
```

### Reset Completo

```bash
# 1. Desinstalar serviço
cd installers
./uninstall-[platform].sh

# 2. Remover dados (CUIDADO: apaga todos os dados!)
# Windows
Remove-Item "$env:LOCALAPPDATA\F-Flow Suite" -Recurse -Force

# macOS
rm -rf ~/Library/Application\ Support/F-Flow\ Suite

# Linux
rm -rf ~/.local/share/f-flow-suite

# 3. Reinstalar
./install-[platform].sh
```

## 🔐 Sistema de Licenciamento

O F-Flow Client Local inclui um sistema robusto de licenciamento que suporta tanto modo de desenvolvimento quanto produção.

### Configuração de Licenciamento

#### Variáveis de Ambiente

```bash
# Configuração obrigatória para produção
LICENSING_ENFORCED=true|false          # Ativa/desativa verificação de licença
HUB_BASE_URL=https://hub.f-flow.com    # URL do F-Flow Hub
DEVICE_ID=unique-device-identifier     # ID único do dispositivo
OFFLINE_GRACE_DAYS=7                   # Dias de tolerância offline (padrão: 7)

# Chave pública RSA para verificação de tokens JWT
LICENSE_PUBLIC_KEY_PEM="-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
-----END PUBLIC KEY-----"
```

#### Geração de Chaves RSA

Para gerar um par de chaves RSA para o sistema de licenciamento:

```bash
# Gerar chave privada (para o Hub)
openssl genrsa -out license-private-key.pem 2048

# Extrair chave pública (para o Client Local)
openssl rsa -in license-private-key.pem -pubout -out license-public-key.pem

# Visualizar chave pública em formato PEM (para variável de ambiente)
cat license-public-key.pem
```

### Endpoints de Licenciamento

#### POST /licensing/activate
Ativa uma licença no dispositivo.

**Request:**
```json
{
  "tenantId": "tenant-uuid",
  "deviceId": "device-uuid",
  "licenseKey": "license-key-optional"
}
```

**Response:**
```json
{
  "status": "activated",
  "message": "Licença ativada com sucesso",
  "expiresIn": 2592000,
  "graceDays": 7,
  "plan": "pro"
}
```

#### GET /licensing/install/status
Verifica o status da instalação e licenciamento.

**Response:**
```json
{
  "needsSetup": false,
  "status": "activated",
  "plan": "pro",
  "exp": 1672531200,
  "grace": 7
}
```

**Status possíveis:**
- `activated`: Licença válida e ativa
- `not_activated`: Sem licença ativada
- `offline_grace`: Offline mas dentro do período de tolerância
- `expired`: Licença expirada
- `development`: Modo de desenvolvimento (LICENSING_ENFORCED=false)

#### GET /licensing/license
Retorna informações da licença atual.

**Response:**
```json
{
  "tenantId": "tenant-uuid",
  "deviceId": "device-uuid",
  "plan": "pro",
  "status": "activated",
  "entitlements": ["POS", "INVENTORY", "GROOMING"],
  "expiresAt": "2024-01-01T00:00:00.000Z"
}
```

### Modos de Operação

#### Modo de Desenvolvimento
Quando `LICENSING_ENFORCED=false`:
- Todas as funcionalidades ficam disponíveis
- Retorna dados mock para licenciamento
- Não requer conexão com o Hub
- Ideal para desenvolvimento e testes

#### Modo de Produção
Quando `LICENSING_ENFORCED=true`:
- Requer licença válida para funcionar
- Verifica tokens JWT com chave pública RSA
- Suporte a modo offline com período de tolerância
- Renovação automática de licenças

### Cenários Offline

O sistema suporta operação offline por um período configurável:

1. **Conexão Normal**: Verifica licença no Hub regularmente
2. **Modo Offline**: Usa token local por até `OFFLINE_GRACE_DAYS` dias
3. **Expiração**: Bloqueia funcionalidades após período de tolerância

### Testando o Sistema

#### Testes Unitários
```bash
npm test -- --testPathPattern=licensing.service.spec.ts
```

#### Testes E2E
```bash
npm run test:e2e
```

#### Teste Manual de Ativação

**Como testar:**

### 1. Preparação do Ambiente
```bash
# Na pasta client-local
cd client-local

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
```

### 2. Modo Desenvolvimento (sem enforcement)
```bash
# Editar .env e definir:
LICENSING_ENFORCED=false

# Iniciar o serviço
npm run start:dev
```

### 3. Testar Endpoints (PowerShell)
```powershell
# Verificar status da instalação
Invoke-RestMethod -Uri "http://localhost:3001/licensing/install/status" -Method GET

# Ativar licença (simulação)
Invoke-RestMethod -Uri "http://localhost:3001/licensing/activate" -Method POST -ContentType "application/json" -Body '{"tenantId": "test-tenant", "deviceId": "test-device"}'

# Verificar licença atual
Invoke-RestMethod -Uri "http://localhost:3001/licensing/license" -Method GET
```

### 4. Modo Produção (com enforcement)
```bash
# Editar .env e definir:
LICENSING_ENFORCED=true

# Gerar chaves RSA (se não existirem)
openssl genrsa -out private_key.pem 2048
openssl rsa -in private_key.pem -pubout -out public_key.pem

# Configurar no .env:
LICENSE_PUBLIC_KEY_PATH=./public_key.pem

# Iniciar o serviço
npm run start:dev
```

### 5. Executar Testes
```bash
# Testes unitários (alguns podem falhar em modo dev)
npm test

# Testes e2e
npm run test:e2e

# Testes com cobertura
npm run test:cov
```

### 6. Testar Modo Offline
1. Ativar uma licença válida
2. Desconectar da internet
3. Reiniciar o serviço
4. Verificar se continua funcionando dentro do grace period (7 dias)

### 7. Resultados Esperados

**Status da Instalação (Modo Dev):**
```json
{
  "needsSetup": false,
  "status": "development", 
  "plan": "development"
}
```

**Ativação (Modo Dev):**
```json
{
  "status": "activated",
  "message": "Licensing not enforced in development mode"
}
```

**Licença Atual (Modo Dev):**
```json
{
  "tid": "dev-tenant",
  "did": "00000000-0000-0000-0000-000000000000",
  "plan": "enterprise",
  "ent": ["POS", "INVENTORY", "GROOMING", "ANALYTICS"],
  "exp": 1759582419,
  "grace": 7,
  "iat": 1759496019,
  "iss": "dev-mode",
  "status": "development"
}
```
```

### Middleware de Proteção

O sistema inclui um `LicensingGuard` que pode ser aplicado a rotas que requerem licença válida:

```typescript
@UseGuards(LicensingGuard)
@Get('protected-endpoint')
async protectedEndpoint() {
  // Este endpoint só funciona com licença válida
}
```

## 🔄 Rollback

Para voltar ao modo de desenvolvimento:

1. **Desinstalar o serviço**:
   ```bash
   cd installers
   ./uninstall-[platform].sh
   ```

2. **Executar em desenvolvimento**:
   ```bash
   npm run start:dev
   ```

3. **Os dados permanecem** no diretório de dados e podem ser reutilizados.

## 📋 Critérios de Aceite

- ✅ `npm run build:pkg` gera executáveis para Win/Mac/Linux
- ✅ Primeira execução cria diretórios e executa migrations
- ✅ `GET /health` retorna `{ status: 'ok' }`
- ✅ Instalação como serviço funciona em todos os SOs
- ✅ Logs estruturados com rotação
- ✅ Desinstalação limpa sem afetar dados do usuário

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.