const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

async function testUpdateCacheFixed() {
  const prisma = new PrismaClient();
  
  try {
    console.log('=== TESTE DO updateLicenseCache CORRIGIDO ===\n');
    
    const tenantId = '3cb88e58-b2e7-4fb1-9e0f-eb5a9c4b640b';
    const deviceId = 'test-device-id';
    const hubBaseUrl = 'http://localhost:8081';
    
    console.log('1. Testando chamada para o Hub...');
    
    try {
      const response = await axios.get(`${hubBaseUrl}/licenses/validate`, {
        params: { tenantId, deviceId }
      });
      
      console.log('Resposta do Hub:');
      console.log(JSON.stringify(response.data, null, 2));
      
      const licenseData = response.data;
      const license = licenseData.license || {};
      
      console.log('\n2. Tentando salvar no cache com mapeamento correto...');
      
      const cacheData = {
        tenantId,
        registered: licenseData.registered || false,
        licensed: licenseData.licensed || false,
        status: licenseData.status || 'not_registered',
        planKey: license.planKey || licenseData.planKey,
        maxSeats: license.maxSeats || licenseData.maxSeats,
        expiresAt: license.expiresAt ? new Date(license.expiresAt) : (licenseData.expiresAt ? new Date(licenseData.expiresAt) : null),
        graceDays: license.graceDays || licenseData.graceDays || 7,
        lastChecked: new Date(),
        updatedAt: new Date()
      };
      
      console.log('Dados que serão salvos (corrigidos):');
      console.log(JSON.stringify(cacheData, null, 2));
      
      const result = await prisma.licenseCache.upsert({
        where: { tenantId },
        update: {
          registered: cacheData.registered,
          licensed: cacheData.licensed,
          status: cacheData.status,
          planKey: cacheData.planKey,
          maxSeats: cacheData.maxSeats,
          expiresAt: cacheData.expiresAt,
          graceDays: cacheData.graceDays,
          lastChecked: cacheData.lastChecked,
          updatedAt: cacheData.updatedAt
        },
        create: {
          tenantId: cacheData.tenantId,
          registered: cacheData.registered,
          licensed: cacheData.licensed,
          status: cacheData.status,
          planKey: cacheData.planKey,
          maxSeats: cacheData.maxSeats,
          expiresAt: cacheData.expiresAt,
          graceDays: cacheData.graceDays,
          lastChecked: cacheData.lastChecked
        }
      });
      
      console.log('\n3. Resultado do upsert:');
      console.log(JSON.stringify(result, null, 2));
      
      console.log('\n4. Verificando se foi salvo...');
      const savedCache = await prisma.licenseCache.findUnique({
        where: { tenantId }
      });
      
      if (savedCache) {
        console.log('Cache salvo com sucesso:');
        console.log(JSON.stringify(savedCache, null, 2));
        
        // Verificar se os dados importantes foram salvos
        if (savedCache.planKey && savedCache.maxSeats && savedCache.expiresAt) {
          console.log('\n✅ SUCESSO: Todos os dados importantes foram salvos corretamente!');
        } else {
          console.log('\n⚠️  ATENÇÃO: Alguns dados importantes estão faltando:');
          console.log('- planKey:', savedCache.planKey);
          console.log('- maxSeats:', savedCache.maxSeats);
          console.log('- expiresAt:', savedCache.expiresAt);
        }
      } else {
        console.log('ERRO: Cache não foi salvo!');
      }
      
    } catch (error) {
      console.error('Erro durante o teste:', error);
      
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
      }
    }
    
  } catch (error) {
    console.error('Erro geral:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testUpdateCacheFixed().catch(console.error);