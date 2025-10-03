# F-Flow Client Local

O **F-Flow Client Local** é um executável multiplataforma que fornece uma API local para o F-Flow Suite, incorporando um banco SQLite e executando migrations automáticas.

## 🚀 Funcionalidades

- **Executável Multiplataforma**: Binários para Windows, macOS e Linux
- **Banco SQLite Embutido**: Database local com migrations automáticas
- **Paths por SO**: Resolve automaticamente diretórios de dados e logs conforme o sistema operacional
- **Servidor NestJS**: API REST em `127.0.0.1:3010`
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
PORT=3010

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
  "message": "Server started on http://127.0.0.1:3010",
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
GET http://127.0.0.1:3010/health
```

Resposta:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 3600
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
# Verificar processo usando a porta 3010
netstat -tulpn | grep 3010  # Linux
netstat -an | findstr 3010  # Windows
lsof -i :3010              # macOS
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