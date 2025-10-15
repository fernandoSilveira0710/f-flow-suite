# F-Flow Suite - Coleção Postman E2E

Esta pasta contém a coleção completa de testes End-to-End (E2E) para o F-Flow Suite, desenvolvida para o Postman.

## 📁 Arquivos

- `F-Flow Suite E2E.postman_collection.json` - Coleção principal com todos os testes
- `F-Flow Suite Environment.postman_environment.json` - Ambiente com variáveis de configuração
- `README.md` - Esta documentação

## 🚀 Como Usar

### 1. Importar no Postman

1. Abra o Postman
2. Clique em "Import" no canto superior esquerdo
3. Selecione os arquivos:
   - `F-Flow Suite E2E.postman_collection.json`
   - `F-Flow Suite Environment.postman_environment.json`
4. Confirme a importação

### 2. Configurar Ambiente

1. Selecione o ambiente "F-Flow Suite Environment" no dropdown superior direito
2. Verifique se as URLs estão corretas:
   - `hub_url`: http://localhost:3001 (HUB)
   - `client_url`: http://localhost:8081 (Client Local)

### 3. Executar Testes

#### Execução Manual
1. Navegue pela coleção "F-Flow Suite E2E"
2. Execute as pastas em ordem:
   1. **Seed** - Configuração inicial
   2. **Health Check** - Verificação de saúde
   3. **Ativar Licença** - Fluxo de ativação
   4. **CRUD** - Operações básicas
   5. **Sync Roundtrip** - Sincronização completa
   6. **Cleanup** - Limpeza final

#### Execução Automática (Collection Runner)
1. Clique com botão direito na coleção "F-Flow Suite E2E"
2. Selecione "Run collection"
3. Configure:
   - Environment: "F-Flow Suite Environment"
   - Iterations: 1
   - Delay: 500ms (opcional)
4. Clique em "Run F-Flow Suite E2E"

## 📋 Fluxo de Testes

### 1. Seed - Configuração Inicial
- **Reset Database**: Limpa o banco de dados do HUB
- **Create Test Tenant**: Cria tenant de teste
- **Create Test License**: Gera licença de teste
- **Seed Sample Data**: Popula dados de exemplo

### 2. Health Check - Verificação de Saúde
- **HUB Health Check**: Verifica saúde do serviço HUB
- **Client Health Check**: Verifica saúde do serviço Client
- **Database Connection Test**: Testa conexão com banco de dados

### 3. Ativar Licença - Fluxo de Ativação
- **Validate License (HUB)**: Valida licença no HUB
- **Activate License (Client)**: Ativa licença no cliente local
- **Validate License (Client Offline)**: Valida licença offline
- **Get License Status**: Obtém status atual da licença

### 4. CRUD - Operações Básicas
- **Create Customer**: Cria novo cliente
- **Get Customer**: Obtém dados do cliente
- **Update Customer**: Atualiza dados do cliente
- **Create Appointment**: Cria novo agendamento
- **List Appointments**: Lista agendamentos por data
- **Update Appointment Status**: Atualiza status do agendamento

### 5. Sync Roundtrip - Sincronização Completa
- **Get Sync Status**: Obtém status da sincronização
- **Push Changes to HUB**: Envia mudanças locais para o HUB
- **Pull Changes from HUB**: Recebe mudanças do HUB
- **Apply Remote Changes**: Aplica mudanças remotas localmente
- **Full Sync Roundtrip**: Executa sincronização completa bidirecional
- **Verify Data Consistency**: Verifica consistência dos dados

### 6. Cleanup - Limpeza Final
- **Delete Test Appointment**: Remove agendamento de teste
- **Delete Test Customer**: Remove cliente de teste

## 🔧 Variáveis de Ambiente

### URLs dos Serviços
- `hub_url`: URL base do serviço HUB (padrão: http://localhost:3001)
- `client_url`: URL base do serviço Client Local (padrão: http://localhost:8081)

### Identificadores de Teste
- `tenant_id`: ID do tenant de teste (padrão: test-tenant-001)
- `device_id`: ID do dispositivo de teste (padrão: test-device-001)

### Tokens e IDs Dinâmicos
- `license_token`: Token da licença (preenchido automaticamente)
- `auth_token`: Token de autenticação (preenchido automaticamente)
- `customer_id`: ID do cliente de teste (preenchido automaticamente)
- `appointment_id`: ID do agendamento de teste (preenchido automaticamente)

## ✅ Testes Automatizados

Cada requisição inclui testes automatizados que verificam:

### Testes Globais (aplicados a todas as requisições)
- **Response Time**: Tempo de resposta < 5 segundos
- **Valid JSON**: Resposta em formato JSON válido

### Testes Específicos
- **Status Codes**: Códigos de resposta esperados (200, 201, 204, etc.)
- **Response Structure**: Estrutura correta das respostas
- **Data Validation**: Validação dos dados retornados
- **Business Logic**: Regras de negócio específicas

## 🚨 Pré-requisitos

### Serviços em Execução
Antes de executar os testes, certifique-se de que os seguintes serviços estão rodando:

1. **HUB Service** (porta 3000)
   ```bash
   cd hub
   npm run start:dev
   ```

2. **Client Local Service** (porta 3001)
   ```bash
   cd client-local
   npm start
   ```

### Banco de Dados
- O HUB deve ter acesso ao banco de dados configurado
- O endpoint `/api/dev/reset` deve estar disponível para limpeza

## 📊 Relatórios

### Execução Manual
- Visualize os resultados diretamente no Postman
- Cada teste mostra status (✅ Pass / ❌ Fail)
- Detalhes dos erros são exibidos na aba "Test Results"

### Collection Runner
- Relatório completo com estatísticas
- Exportação em formato JSON/HTML
- Histórico de execuções

### Newman (CLI)
Para execução via linha de comando:

```bash
# Instalar Newman
npm install -g newman

# Executar coleção
newman run "F-Flow Suite E2E.postman_collection.json" \
  -e "F-Flow Suite Environment.postman_environment.json" \
  --reporters cli,html \
  --reporter-html-export report.html
```

## 🔍 Troubleshooting

### Problemas Comuns

1. **Serviços não estão rodando**
   - Verifique se HUB e Client estão em execução
   - Confirme as portas corretas (3000 e 3001)

2. **Falha na validação de licença**
   - Verifique se o token foi gerado corretamente no step "Create Test License"
   - Confirme se o tenant_id está correto

3. **Erros de sincronização**
   - Verifique conectividade entre Client e HUB
   - Confirme se os dados foram criados corretamente nos steps anteriores

4. **Timeouts**
   - Aumente o timeout nas configurações do Postman
   - Verifique performance dos serviços

### Logs e Debug
- Ative logs detalhados nos serviços
- Use o Console do Postman para debug de scripts
- Verifique variáveis de ambiente no painel lateral

## 🤝 Contribuição

Para adicionar novos testes:

1. Crie uma nova pasta ou requisição na coleção
2. Adicione testes automatizados na aba "Tests"
3. Use variáveis de ambiente para dados dinâmicos
4. Documente o propósito do teste
5. Atualize este README se necessário

## 📝 Notas

- Os testes são projetados para serem executados em sequência
- Dados de teste são limpos automaticamente no final
- A coleção pode ser executada múltiplas vezes sem conflitos
- Todos os endpoints são testados com dados realistas