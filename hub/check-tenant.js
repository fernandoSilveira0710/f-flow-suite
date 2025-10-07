const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTenant() {
  try {
    const tenants = await prisma.tenant.findMany();
    console.log('All tenants:', tenants);
    
    const tenant1 = await prisma.tenant.findUnique({
      where: { id: 'tenant-1' }
    });
    console.log('Tenant with ID tenant-1:', tenant1);
    
  } catch (error) {
    console.error('Error checking tenant:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTenant();