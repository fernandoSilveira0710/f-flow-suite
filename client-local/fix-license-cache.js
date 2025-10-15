const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixLicenseCache() {
  try {
    console.log('🔧 Corrigindo cache de licença...');
    
    // Atualizar o cache com o planKey correto
    const updatedCache = await prisma.licenseCache.update({
      where: { tenantId: '3cb88e58-b2e7-4fb1-9e0f-eb5a9c4b640b' },
      data: {
        planKey: 'max',
        lastChecked: new Date(),
        updatedAt: new Date()
      }
    });
    
    console.log('✅ Cache atualizado:', JSON.stringify(updatedCache, null, 2));
    
  } catch (error) {
    console.error('❌ Erro ao atualizar cache:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixLicenseCache();