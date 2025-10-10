const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLicenseForTenant() {
  try {
    const license = await prisma.license.findUnique({
      where: { tenantId: '3cb88e58-b2e7-4fb1-9e0f-eb5a9c4b640b' },
      include: { tenant: true }
    });
    console.log('Licença para o tenant:', JSON.stringify(license, null, 2));
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLicenseForTenant();