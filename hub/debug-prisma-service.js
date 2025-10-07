const { PrismaClient } = require('@prisma/client');

// Simular exatamente como o NestJS usa o Prisma
class PrismaService extends PrismaClient {
  constructor() {
    super();
  }

  async onModuleInit() {
    await this.$connect();
  }
}

async function testPrismaService() {
  const prisma = new PrismaService();
  
  try {
    await prisma.onModuleInit();
    console.log('PrismaService initialized');
    
    // Simular o middleware de tenant
    const tenantId = 'tenant-1';
    const sanitizedTenantId = tenantId.replace(/'/g, "''");
    await prisma.$executeRawUnsafe(
      `SET app.tenant_id = '${sanitizedTenantId}'`
    );
    
    console.log('Tenant context set');
    
    // Verificar se o tenant existe
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    });
    
    console.log('Tenant found:', tenant ? 'YES' : 'NO');
    
    // Tentar criar um recurso
    console.log('Attempting to create resource...');
    const resource = await prisma.resource.create({
      data: {
        name: 'Test Resource Service',
        type: 'equipment',
        description: 'Test description',
        active: true,
        tenantId: tenantId,
      },
    });
    
    console.log('Resource created successfully:', resource);
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Error code:', error.code);
  } finally {
    await prisma.$disconnect();
  }
}

testPrismaService();