# Auto-Update Module

O módulo de auto-update permite que o F-Flow Client Local se atualize automaticamente verificando novas versões no GitHub Releases.

## Funcionalidades

- ✅ Verificação automática de atualizações a cada 6 horas
- ✅ Download e instalação automática de novas versões
- ✅ API REST para controle manual de atualizações
- ✅ Suporte multiplataforma (Windows, macOS, Linux)
- ✅ Progresso de download em tempo real
- ✅ Instalação silenciosa com reinicialização automática

## Configuração

### Variáveis de Ambiente

```bash
# Repositório GitHub (obrigatório)
GITHUB_REPO=2fsolutions/f-flow-suite

# Token GitHub para acesso a releases privados (opcional)
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx

# Intervalo de verificação em horas (padrão: 6)
AUTO_UPDATE_INTERVAL_HOURS=6

# Habilitar auto-update (padrão: true)
AUTO_UPDATE_ENABLED=true
```

### Estrutura de Assets

O serviço espera que os releases do GitHub contenham assets com os seguintes nomes:

- **Windows**: `f-flow-client-win32-x64.exe`
- **macOS**: `f-flow-client-darwin-x64.dmg`
- **Linux**: `f-flow-client-linux-x64.AppImage`

## API Endpoints

### GET /auto-update/version
Retorna a versão atual do cliente.

```json
{
  "version": "1.0.0"
}
```

### GET /auto-update/check
Verifica se há atualizações disponíveis.

```json
{
  "hasUpdate": true,
  "currentVersion": "1.0.0",
  "latestVersion": "1.1.0",
  "releaseNotes": "- Nova funcionalidade X\n- Correção de bug Y",
  "downloadUrl": "https://github.com/owner/repo/releases/download/v1.1.0/f-flow-client-win32-x64.exe"
}
```

### GET /auto-update/progress
Retorna o progresso da atualização atual.

```json
{
  "isUpdating": true,
  "progress": 45,
  "status": "downloading"
}
```

### POST /auto-update/install
Inicia o processo de instalação da atualização.

```json
{
  "message": "Update installation started. Check progress endpoint for status."
}
```

## Fluxo de Atualização

1. **Verificação**: O serviço verifica automaticamente por novas versões a cada 6 horas
2. **Comparação**: Compara a versão atual com a versão mais recente no GitHub
3. **Download**: Se uma nova versão estiver disponível, faz o download do asset apropriado
4. **Instalação**: Executa o instalador de forma silenciosa
5. **Reinicialização**: Reinicia o serviço após a instalação bem-sucedida

## Segurança

- ✅ Verificação de integridade dos arquivos baixados
- ✅ Validação de versões usando semver
- ✅ Logs detalhados de todas as operações
- ✅ Tratamento de erros robusto
- ✅ Rollback automático em caso de falha

## Logs

Os logs de atualização são salvos em:
- **Windows**: `%APPDATA%/f-flow-client/logs/auto-update.log`
- **macOS**: `~/Library/Logs/f-flow-client/auto-update.log`
- **Linux**: `~/.local/share/f-flow-client/logs/auto-update.log`

## Desenvolvimento

### Executar Testes

```bash
npm test -- auto-update
```

### Testar Manualmente

```bash
# Verificar versão atual
curl http://localhost:3001/auto-update/version

# Verificar atualizações
curl http://localhost:3001/auto-update/check

# Instalar atualização
curl -X POST http://localhost:3001/auto-update/install

# Verificar progresso
curl http://localhost:3001/auto-update/progress
```

## Troubleshooting

### Problemas Comuns

1. **Erro de permissão**: Certifique-se de que o cliente tem permissões para escrever no diretório de instalação
2. **Falha no download**: Verifique a conectividade com o GitHub e o token de acesso
3. **Versão não encontrada**: Confirme que o release contém o asset correto para sua plataforma

### Debug

Para habilitar logs detalhados, defina:

```bash
LOG_LEVEL=debug
```