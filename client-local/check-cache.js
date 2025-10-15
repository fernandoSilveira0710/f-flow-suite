const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCache() {
  try {
    const cache = await prisma.licenseCache.findUnique({
      where: { tenantId: '3cb88e58-b2e7-4fb1-9e0f-eb5a9c4b640b' }
    });
    console.log('Cache encontrado:', JSON.stringify(cache, null, 2));
    
    // Também vamos verificar todos os registros
    const allCaches = await prisma.licenseCache.findMany();
    console.log('\nTodos os caches:', JSON.stringify(allCaches, null, 2));
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCache();