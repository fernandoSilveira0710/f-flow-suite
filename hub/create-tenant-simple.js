const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTenant() {
  try {
    // Create organization
    const org = await prisma.org.upsert({
      where: { name: 'Test Org' },
      update: {},
      create: { 
        id: 'test-org-id',
        name: 'Test Org' 
      },
    });

    // Create tenant with tenant-1 ID
    const tenant = await prisma.tenant.upsert({
      where: { slug: 'test-tenant' },
      update: { id: 'tenant-1' },
      create: {
        id: 'tenant-1',
        slug: 'test-tenant',
        orgId: org.id,
        planId: 'pro',
      },
    });

    console.log('Tenant created successfully:', tenant);
  } catch (error) {
    console.error('Error creating tenant:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTenant();