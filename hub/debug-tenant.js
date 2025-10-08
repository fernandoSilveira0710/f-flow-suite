const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function debugTenant() {
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('Database connection successful:', result);
    
    // Check if tenant exists
    console.log('\nChecking tenant with ID "tenant-1"...');
    const tenant = await prisma.tenant.findUnique({
      where: { id: 'tenant-1' }
    });
    
    if (tenant) {
      console.log('Tenant found:', tenant);
    } else {
      console.log('Tenant NOT found');
    }
    
    // Try to create a resource directly
    console.log('\nAttempting to create resource...');
    const resource = await prisma.resource.create({
      data: {
        name: 'Test Resource',
        type: 'room',
        description: 'Test description',
        active: true,
        tenantId: 'tenant-1'
      }
    });
    
    console.log('Resource created successfully:', resource);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugTenant();