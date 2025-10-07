const { PrismaClient } = require('@prisma/client');

async function debugHubContext() {
  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    console.log('Connected to database');
    
    const tenantId = 'tenant-1';
    
    // Simular o que o middleware faz
    console.log('Setting tenant context...');
    const sanitizedTenantId = tenantId.replace(/'/g, "''");
    await prisma.$executeRawUnsafe(`SET app.tenant_id = '${sanitizedTenantId}'`);
    
    // Verificar se conseguimos acessar o tenant com RLS ativo
    console.log('Checking tenant access with RLS...');
    try {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId }
      });
      console.log('Tenant found with RLS:', tenant ? 'YES' : 'NO');
    } catch (error) {
      console.error('Error accessing tenant with RLS:', error.message);
    }
    
    // Simular exatamente o que o ResourcesService faz
    console.log('Simulating ResourcesService.create...');
    
    // 1. Verificar se já existe um recurso com o mesmo nome
    try {
      const existingResource = await prisma.resource.findFirst({
        where: {
          tenantId,
          name: 'Test Hub Context',
        },
      });
      console.log('Existing resource check:', existingResource ? 'FOUND' : 'NOT FOUND');
    } catch (error) {
      console.error('Error checking existing resource:', error.message);
    }
    
    // 2. Tentar criar o recurso
    try {
      const resource = await prisma.resource.create({
        data: {
          name: 'Test Hub Context',
          type: 'equipment',
          description: 'Test description',
          active: true,
          tenantId: tenantId,
        },
      });
      
      console.log('Resource created successfully:', resource);
    } catch (error) {
      console.error('Error creating resource:', error.message);
      console.error('Error code:', error.code);
      
      // Verificar se é um problema de foreign key
      if (error.message.includes('Foreign key constraint')) {
        console.log('This is a foreign key constraint violation');
        
        // Tentar verificar se o tenant existe sem RLS
        console.log('Checking tenant without RLS context...');
        await prisma.$executeRawUnsafe(`RESET app.tenant_id`);
        
        const tenantWithoutRLS = await prisma.tenant.findUnique({
          where: { id: tenantId }
        });
        console.log('Tenant exists without RLS:', tenantWithoutRLS ? 'YES' : 'NO');
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugHubContext();