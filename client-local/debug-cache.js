const { PrismaClient } = require('@prisma/client');

async function debugCache() {
  const prisma = new PrismaClient();
  
  try {
    console.log('=== DEBUG CACHE DE LICENÇA ===\n');
    
    // Verificar se a tabela existe
    console.log('1. Verificando estrutura da tabela LicenseCache...');
    try {
      const result = await prisma.$queryRaw`
        SELECT name FROM sqlite_master WHERE type='table' AND name='LicenseCache';
      `;
      console.log('Tabela LicenseCache existe:', result.length > 0);
      
      if (result.length > 0) {
        // Verificar colunas da tabela
        const columns = await prisma.$queryRaw`
          PRAGMA table_info(LicenseCache);
        `;
        console.log('Colunas da tabela:', columns);
      }
    } catch (error) {
      console.error('Erro ao verificar tabela:', error.message);
    }
    
    console.log('\n2. Buscando todos os registros na tabela LicenseCache...');
    try {
      const allCaches = await prisma.licenseCache.findMany();
      console.log('Total de registros encontrados:', allCaches.length);
      
      if (allCaches.length > 0) {
        console.log('Registros encontrados:');
        allCaches.forEach((cache, index) => {
          console.log(`\n--- Registro ${index + 1} ---`);
          console.log('ID:', cache.id);
          console.log('Tenant ID:', cache.tenantId);
          console.log('Registered:', cache.registered);
          console.log('Licensed:', cache.licensed);
          console.log('Status:', cache.status);
          console.log('Plan Key:', cache.planKey);
          console.log('Max Seats:', cache.maxSeats);
          console.log('Expires At:', cache.expiresAt);
          console.log('Grace Days:', cache.graceDays);
          console.log('Last Checked:', cache.lastChecked);
          console.log('Created At:', cache.createdAt);
          console.log('Updated At:', cache.updatedAt);
        });
      } else {
        console.log('Nenhum registro encontrado na tabela LicenseCache');
      }
    } catch (error) {
      console.error('Erro ao buscar registros:', error.message);
    }
    
    console.log('\n3. Buscando especificamente pelo tenant 3cb88e58-b2e7-4fb1-9e0f-eb5a9c4b640b...');
    try {
      const specificCache = await prisma.licenseCache.findUnique({
        where: { tenantId: '3cb88e58-b2e7-4fb1-9e0f-eb5a9c4b640b' }
      });
      
      if (specificCache) {
        console.log('Cache encontrado para o tenant específico:');
        console.log(JSON.stringify(specificCache, null, 2));
      } else {
        console.log('Nenhum cache encontrado para o tenant específico');
      }
    } catch (error) {
      console.error('Erro ao buscar cache específico:', error.message);
    }
    
    console.log('\n4. Verificando todas as tabelas no banco...');
    try {
      const tables = await prisma.$queryRaw`
        SELECT name FROM sqlite_master WHERE type='table';
      `;
      console.log('Tabelas no banco:', tables.map(t => t.name));
    } catch (error) {
      console.error('Erro ao listar tabelas:', error.message);
    }
    
  } catch (error) {
    console.error('Erro geral:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugCache().catch(console.error);