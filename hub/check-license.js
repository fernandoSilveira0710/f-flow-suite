const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLicense() {
  try {
    const license = await prisma.license.findUnique({
      where: { tenantId: '3cb88e58-b2e7-4fb1-9e0f-eb5a9c4b640b' },
      include: { tenant: true }
    });
    console.log('Licença encontrada:', JSON.stringify(license, null, 2));
    
    // Também verificar todas as licenças
    const allLicenses = await prisma.license.findMany({
      include: { tenant: true }
    });
    console.log('\nTodas as licenças:', JSON.stringify(allLicenses, null, 2));
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLicense();