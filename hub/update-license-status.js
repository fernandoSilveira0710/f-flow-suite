const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateLicenseStatus() {
  try {
    const updatedLicense = await prisma.license.update({
      where: { tenantId: '3cb88e58-b2e7-4fb1-9e0f-eb5a9c4b640b' },
      data: { status: 'active' },
      include: { tenant: true }
    });
    console.log('Licença atualizada:', JSON.stringify(updatedLicense, null, 2));
  } catch (error) {
    console.error('Erro ao atualizar licença:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateLicenseStatus();