# F-Flow Hub

Hub central do F-Flow Suite responsável por gerenciar licenças, tenants e sincronização de dados.

## Funcionalidades

- **Row Level Security (RLS)**: Isolamento de dados por tenant
- **JWKS Endpoint**: Exposição de chaves públicas para validação de licenças
- **Gerenciamento de Licenças**: Ativação e validação de licenças
- **API de Tenants**: Gerenciamento de inquilinos

## Configuração

### Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env` e configure as variáveis:

```bash
cp .env.example .env
```

#### Configurações Principais

- `DATABASE_URL`: URL de conexão com PostgreSQL
- `RLS_ENFORCED`: Habilita/desabilita Row Level Security (padrão: true)
- `RLS_TENANT_HEADER`: Header HTTP usado para identificar o tenant (padrão: x-tenant-id)
- `LICENSE_PRIVATE_KEY_PEM`: Chave privada RS256 para assinar licenças
- `LICENSE_PUBLIC_KEY_PEM`: Chave pública RS256 para validação (exposta via JWKS)

### Gerando Chaves RSA

Para gerar um par de chaves RSA para licenciamento:

```bash
# Gerar chave privada
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out license_private.pem

# Extrair chave pública
openssl rsa -pubout -in license_private.pem -out license_public.pem
```

Ou usando Node.js:

```javascript
const crypto = require('crypto');
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});
console.log('Private Key:', privateKey);
console.log('Public Key:', publicKey);
```

## Row Level Security (RLS)

O Hub implementa RLS para garantir isolamento completo de dados por tenant.

### Como Funciona

1. **Middleware Global**: `PrismaTenantMiddleware` intercepta todas as requisições
2. **Header Obrigatório**: Todas as rotas protegidas exigem o header `x-tenant-id`
3. **Isolamento Automático**: Queries são automaticamente filtradas por tenant
4. **Rotas Públicas**: Endpoints como `/health` e `/.well-known/jwks.json` são excluídos

### Políticas RLS

As políticas são aplicadas via SQL em `sql/002-rls-policies.sql`:

- Habilita RLS em todas as tabelas
- Cria políticas que filtram por `tenant_id`
- Garante que usuários só vejam dados do seu tenant

### Testando RLS

```bash
# Sem header x-tenant-id (deve retornar 403)
curl http://localhost:3000/tenants

# Com header válido (deve retornar 200)
curl -H "x-tenant-id: test-tenant" http://localhost:3000/tenants
```

## JWKS Endpoint

O endpoint `/.well-known/jwks.json` expõe a chave pública para validação de licenças.

### Formato da Resposta

```json
{
  "keys": [
    {
      "kty": "RSA",
      "n": "base64-encoded-modulus",
      "e": "AQAB",
      "use": "sig",
      "alg": "RS256",
      "kid": "license-key"
    }
  ]
}
```

### Uso

Este endpoint é usado pelos clientes locais para:
1. Baixar a chave pública do Hub
2. Validar assinaturas de licenças offline
3. Verificar integridade de tokens JWT

## Desenvolvimento

### Instalação

```bash
npm install
```

### Executar em Desenvolvimento

```bash
npm run start:dev
```

### Migrations

```bash
# Executar migrations
npm run prisma:migrate

# Gerar cliente Prisma
npm run prisma:generate
```

### Testes

```bash
# Executar todos os testes
npm test

# Executar testes em modo watch
npm run test:watch

# Executar testes com coverage
npm run test:cov
```

### Testes de Integração

Os testes de integração verificam:

- Isolamento de dados por tenant
- Funcionamento do middleware RLS
- Acesso a endpoints públicos
- Validação de headers obrigatórios

## Endpoints

### Públicos (sem autenticação)

- `GET /health` - Status da aplicação
- `GET /.well-known/jwks.json` - Chaves públicas JWKS

### Protegidos (requerem x-tenant-id)

- `GET /tenants` - Listar tenants
- `POST /licenses/activate` - Ativar licença
- Outros endpoints da API

## Segurança

- **RLS Enforced**: Isolamento garantido por tenant
- **Headers Obrigatórios**: Validação de tenant em todas as rotas protegidas
- **Chaves RSA**: Criptografia forte para licenciamento
- **Logs Estruturados**: Auditoria completa de acessos

## Troubleshooting

### Erro 403 "Missing tenant"

Certifique-se de incluir o header `x-tenant-id` nas requisições:

```bash
curl -H "x-tenant-id: your-tenant-id" http://localhost:3000/api-endpoint
```

### Erro 500 no JWKS

Verifique se `LICENSE_PUBLIC_KEY_PEM` está configurado corretamente no `.env`.

### RLS não funcionando

1. Verifique se `RLS_ENFORCED=true` no `.env`
2. Execute as migrations: `npm run prisma:migrate`
3. Aplique as políticas SQL: execute `sql/002-rls-policies.sql`