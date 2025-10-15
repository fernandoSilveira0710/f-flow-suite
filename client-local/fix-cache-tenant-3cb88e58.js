const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixCacheForTenant() {
  try {
    console.log('🔧 Corrigindo cache inconsistente para tenant 3cb88e58-b2e7-4fb1-9e0f-eb5a9c4b640b...');
    
    const tenantId = '3cb88e58-b2e7-4fb1-9e0f-eb5a9c4b640b';
    
    // 1. Verificar estado atual do cache
    console.log('\n1. Estado atual do cache:');
    const currentCache = await prisma.licenseCache.findUnique({
      where: { tenantId }
    });
    
    if (currentCache) {
      console.log('Cache atual:', JSON.stringify(currentCache, null, 2));
    } else {
      console.log('Nenhum cache encontrado para este tenant');
    }
    
    // 2. Atualizar o cache com o planKey correto ('max')
    console.log('\n2. Atualizando cache para planKey: "max"...');
    
    const updatedCache = await prisma.licenseCache.upsert({
      where: { tenantId },
      update: {
        planKey: 'max',
        status: 'active',
        licensed: true,
        registered: true,
        lastChecked: new Date(),
        updatedAt: new Date()
      },
      create: {
        tenantId,
        planKey: 'max',
        status: 'active',
        licensed: true,
        registered: true,
        maxSeats: 10,
        graceDays: 7,
        expiresAt: new Date('2025-11-08T17:03:42.022Z'),
        lastChecked: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    console.log('✅ Cache atualizado com sucesso:');
    console.log(JSON.stringify(updatedCache, null, 2));
    
    // 3. Verificar se a atualização foi bem-sucedida
    console.log('\n3. Verificando atualização...');
    const verifyCache = await prisma.licenseCache.findUnique({
      where: { tenantId }
    });
    
    if (verifyCache && verifyCache.planKey === 'max') {
      console.log('✅ Verificação bem-sucedida! Cache agora tem planKey: "max"');
    } else {
      console.log('❌ Verificação falhou! Cache ainda não está correto');
    }
    
    console.log('\n🎉 Correção do cache concluída!');
    
  } catch (error) {
    console.error('❌ Erro ao corrigir cache:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixCacheForTenant();