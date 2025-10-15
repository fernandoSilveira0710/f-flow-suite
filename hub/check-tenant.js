const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTenant() {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: '3cb88e58-b2e7-4fb1-9e0f-eb5a9c4b640b' }
    });
    console.log('Tenant encontrado:', JSON.stringify(tenant, null, 2));
    
    if (!tenant) {
      console.log('\nTenant não existe! Vamos verificar todos os tenants:');
      const allTenants = await prisma.tenant.findMany();
      console.log('Todos os tenants:', JSON.stringify(allTenants, null, 2));
    }
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTenant();