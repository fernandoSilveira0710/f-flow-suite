const { PrismaClient } = require('@prisma/client');

// Simular o contexto do Hub
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testResourceCreation() {
  try {
    console.log('Setting tenant context...');
    
    // Simular o middleware de tenant
    const tenantId = 'tenant-1';
    const sanitizedTenantId = tenantId.replace(/'/g, "''");
    await prisma.$executeRawUnsafe(
      `SET app.tenant_id = '${sanitizedTenantId}'`
    );
    
    console.log('Tenant context set successfully');
    
    // Verificar se o tenant existe
    const existingResource = await prisma.resource.findFirst({
      where: {
        name: 'Sala de Banho',
        tenantId: tenantId,
      },
    });

    if (existingResource) {
      console.log('Resource already exists:', existingResource);
      return;
    }

    // Criar o recurso
    console.log('Creating resource...');
    const resource = await prisma.resource.create({
      data: {
        name: 'Sala de Banho',
        type: 'room',
        description: 'Sala equipada para banho e tosa de pets',
        active: true,
        tenantId: tenantId,
      },
    });

    console.log('Resource created successfully:', resource);
    
  } catch (error) {
    console.error('Error creating resource:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testResourceCreation();