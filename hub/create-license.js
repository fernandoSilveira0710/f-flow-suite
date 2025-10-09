require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function createLicense() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });
  
  try {
    // Verificar se o tenant existe
    const tenant = await prisma.tenant.findUnique({
      where: { id: 'tenant-1' }
    });
    
    if (!tenant) {
      console.log('Tenant não encontrado. Criando tenant...');
      
      // Criar org primeiro
      await prisma.org.upsert({
        where: { id: 'test-org-id' },
        update: {},
        create: {
          id: 'test-org-id',
          name: 'Test Org'
        }
      });
      
      // Criar tenant
      await prisma.tenant.create({
        data: {
          id: 'tenant-1',
          orgId: 'test-org-id',
          slug: 'test-tenant',
          planId: 'pro'
        }
      });
      
      console.log('Tenant criado com sucesso!');
    }
    
    // Criar licença
    const license = await prisma.license.upsert({
      where: { tenantId: 'tenant-1' },
      update: {
        planKey: 'starter',
        status: 'active',
        maxSeats: 5,
        expiry: new Date('2025-12-31T23:59:59.000Z'),
        graceDays: 7
      },
      create: {
        tenantId: 'tenant-1',
        planKey: 'starter',
        status: 'active',
        maxSeats: 5,
        expiry: new Date('2025-12-31T23:59:59.000Z'),
        graceDays: 7
      }
    });
    
    console.log('Licença criada/atualizada com sucesso:', license);
    
  } catch (error) {
    console.error('Erro ao criar licença:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createLicense();