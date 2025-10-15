require('dotenv').config();
const { Client } = require('pg');

async function createLicenseDirect() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    await client.connect();
    console.log('Conectado ao banco de dados');
    
    // Verificar se o tenant existe
    const tenantResult = await client.query('SELECT id FROM "Tenant" WHERE id = $1', ['tenant-1']);
    
    if (tenantResult.rows.length === 0) {
      console.log('Tenant não encontrado. Criando tenant...');
      
      // Criar org primeiro
      await client.query(`
        INSERT INTO "Org" (id, name, "createdAt") 
        VALUES ($1, $2, NOW()) 
        ON CONFLICT (id) DO NOTHING
      `, ['test-org-id', 'Test Org']);
      
      // Criar tenant
      await client.query(`
        INSERT INTO "Tenant" (id, "orgId", slug, "planId", "createdAt") 
        VALUES ($1, $2, $3, $4, NOW()) 
        ON CONFLICT (id) DO NOTHING
      `, ['tenant-1', 'test-org-id', 'test-tenant', 'pro']);
      
      console.log('Tenant criado com sucesso!');
    } else {
      console.log('Tenant já existe');
    }
    
    // Criar licença
    const licenseResult = await client.query(`
      INSERT INTO "License" ("tenantId", "planKey", "status", "maxSeats", "expiry", "graceDays", "createdAt", "updatedAt") 
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) 
      ON CONFLICT ("tenantId") DO UPDATE SET
        "planKey" = EXCLUDED."planKey",
        "status" = EXCLUDED."status",
        "maxSeats" = EXCLUDED."maxSeats",
        "expiry" = EXCLUDED."expiry",
        "graceDays" = EXCLUDED."graceDays",
        "updatedAt" = NOW()
      RETURNING *
    `, ['tenant-1', 'starter', 'active', 5, '2025-12-31T23:59:59.000Z', 7]);
    
    console.log('Licença criada/atualizada com sucesso:', licenseResult.rows[0]);
    
    // Criar entitlements para o plano starter
    const entitlements = [
      { planKey: 'starter', key: 'POS', value: 'true' },
      { planKey: 'starter', key: 'INVENTORY', value: 'true' },
      { planKey: 'starter', key: 'CUSTOMERS', value: 'true' },
      { planKey: 'starter', key: 'PETS', value: 'true' },
      { planKey: 'starter', key: 'SERVICES', value: 'true' },
      { planKey: 'starter', key: 'PROFESSIONALS', value: 'true' },
      { planKey: 'starter', key: 'APPOINTMENTS', value: 'true' },
      { planKey: 'starter', key: 'GROOMING', value: 'true' }
    ];
    
    for (const ent of entitlements) {
      await client.query(`
        INSERT INTO "Entitlement" ("planKey", "key", "value", "createdAt", "updatedAt") 
        VALUES ($1, $2, $3, NOW(), NOW()) 
        ON CONFLICT ("planKey", "key") DO UPDATE SET
          "value" = EXCLUDED."value",
          "updatedAt" = NOW()
      `, [ent.planKey, ent.key, ent.value]);
    }
    
    console.log('Entitlements criados com sucesso!');
    
  } catch (error) {
    console.error('Erro ao criar licença:', error);
  } finally {
    await client.end();
  }
}

createLicenseDirect();