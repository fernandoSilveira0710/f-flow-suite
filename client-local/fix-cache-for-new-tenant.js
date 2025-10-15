const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixCacheForNewTenant() {
  try {
    console.log('🔧 Populando cache para o novo tenant...');
    
    // Criar registro no cache com o planKey correto
    const newCache = await prisma.licenseCache.create({
      data: {
        tenantId: 'cf0fee8c-5cb6-493b-8f02-d4fc045b114b',
        registered: true,
        licensed: true,
        status: 'active',
        planKey: 'max',
        maxSeats: 10,
        expiresAt: new Date('2026-10-10T13:05:30.330Z'),
        graceDays: 7,
        lastChecked: new Date(),
        updatedAt: new Date()
      }
    });
    
    console.log('✅ Cache criado:', JSON.stringify(newCache, null, 2));
    
    // Verificar se foi criado corretamente
    const verification = await prisma.licenseCache.findUnique({
      where: { tenantId: 'cf0fee8c-5cb6-493b-8f02-d4fc045b114b' }
    });
    
    console.log('✅ Verificação:', JSON.stringify(verification, null, 2));
    
  } catch (error) {
    console.error('❌ Erro ao criar cache:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixCacheForNewTenant();