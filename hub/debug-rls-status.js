const { PrismaClient } = require('@prisma/client');

async function debugRLSStatus() {
  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    console.log('Connected to database');
    
    // Verificar se RLS está habilitado nas tabelas
    const rlsStatus = await prisma.$queryRaw`
      SELECT 
        schemaname, 
        tablename, 
        rowsecurity
      FROM pg_tables 
      WHERE tablename IN ('Resource', 'Tenant');
    `;
    
    console.log('RLS Status:', rlsStatus);
    
    // Verificar o valor atual do app.tenant_id
    try {
      const currentTenantId = await prisma.$queryRaw`
        SELECT current_setting('app.tenant_id', true) as current_tenant_id;
      `;
      console.log('Current app.tenant_id:', currentTenantId);
    } catch (error) {
      console.log('app.tenant_id not set or error:', error.message);
    }
    
    // Testar se conseguimos acessar o tenant com RLS
    const tenantId = 'tenant-1';
    
    // Definir o tenant_id
    await prisma.$executeRawUnsafe(`SET app.tenant_id = '${tenantId}'`);
    console.log('Set app.tenant_id to:', tenantId);
    
    // Verificar novamente o valor
    const newCurrentTenantId = await prisma.$queryRaw`
      SELECT current_setting('app.tenant_id', true) as current_tenant_id;
    `;
    console.log('New current app.tenant_id:', newCurrentTenantId);
    
    // Tentar acessar o tenant
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    });
    
    console.log('Tenant accessible with RLS:', tenant ? 'YES' : 'NO');
    
    // Tentar criar um recurso
    try {
      const resource = await prisma.resource.create({
        data: {
          name: 'Test RLS Resource',
          type: 'equipment',
          description: 'Test description',
          active: true,
          tenantId: tenantId,
        },
      });
      
      console.log('Resource created with RLS:', resource ? 'YES' : 'NO');
    } catch (error) {
      console.error('Error creating resource with RLS:', error.message);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugRLSStatus();