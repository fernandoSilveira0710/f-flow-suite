# F-Flow Hub

Hub central do F-Flow Suite responsável por gerenciar licenças, tenants e sincronização de dados.

## 🚀 Acesso Rápido

- **API Hub**: http://localhost:8081
- **Prisma Studio**: http://localhost:5555
- **Health Check**: http://localhost:8081/health
- **JWKS Endpoint**: http://localhost:8081/.well-known/jwks.json

## 👥 Usuários de Teste

### Usuários cadastrados no sistema:
1. **Admin Principal**
   - Email: `luisfernando@email.com`
   - Senha: `123456`
   - Role: `admin`

2. **Usuário de Teste**
   - Email: `teste@exemplo.com`
   - Senha: `123456`
   - Role: `admin`

3. **Login de Teste**
   - Email: `logintest@2fsolutions.com.br`
   - Senha: `123456`
   - Role: `admin`

4. **Terceiro Usuário**
   - Email: `terceiro@exemplo.com`
   - Senha: `123456`
   - Role: `admin`

## 🔗 Endpoints Principais

| Endpoint | Método | Descrição |
| -------- | ------ | --------- |
| `/health` | GET | Status da API |
| `/public/login` | POST | Autenticação de usuários |
| `/tenants` | GET/POST | Gerenciamento de tenants |
| `/licenses` | GET/POST | Gerenciamento de licenças |
| `/.well-known/jwks.json` | GET | Chaves públicas JWKS |

## Funcionalidades

- **Row Level Security (RLS)**: Isolamento de dados por tenant
- **JWKS Endpoint**: Exposição de chaves públicas para validação de licenças
- **Gerenciamento de Licenças**: Ativação e validação de licenças
- **API de Tenants**: Gerenciamento de inquilinos
- **Integração Offline**: Suporte a autenticação offline via Client-Local

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

## Integração Offline

O Hub suporta operação offline através do Client-Local, permitindo que usuários continuem trabalhando mesmo quando a conexão com o Hub está indisponível.

### Como Funciona

1. **Sincronização Prévia**: Usuários e licenças são sincronizados do Hub para o Client-Local
2. **Cache Local**: Client-Local mantém cache de usuários e licenças válidas
3. **Detecção Automática**: Sistema detecta quando Hub está indisponível
4. **Fallback Offline**: Autenticação é redirecionada para Client-Local (`/auth/offline-login`)
5. **Validação Local**: Credenciais são validadas contra cache local
6. **Licença Offline**: Licenças são validadas usando chave pública JWKS

### Configuração para Offline

Para habilitar operação offline, o Client-Local precisa:

1. **Chave Pública JWKS**: Baixada do endpoint `/.well-known/jwks.json`
2. **Cache de Usuários**: Sincronizado via `/users/sync`
3. **Licença Válida**: Persistida localmente com assinatura verificável

### Endpoints Relacionados

- `GET /.well-known/jwks.json` - Chave pública para validação offline
- `POST /public/login` - Autenticação online (fallback para offline se indisponível)
- `GET /users` - Sincronização de usuários para cache local

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
- `GET /users` - Listar usuários (usado para sincronização offline)
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

### Problemas de Integração Offline

#### Client-Local não consegue validar licenças offline

1. Verifique se o endpoint JWKS está acessível: `curl http://localhost:8081/.well-known/jwks.json`
2. Confirme se `LICENSE_PUBLIC_KEY_PEM` está configurado no Hub
3. Verifique se o Client-Local baixou a chave pública corretamente

#### Usuários não sincronizados para cache local

1. Teste o endpoint de usuários: `curl -H "x-tenant-id: your-tenant" http://localhost:8081/users`
2. Verifique se o Client-Local está executando a sincronização
3. Confirme se há usuários cadastrados no tenant específico