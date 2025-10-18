const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function run() {
  try {
    const org = await prisma.org.upsert({
      where: { name: '2F Demo' },
      update: {},
      create: { name: '2F Demo' },
    });

    const TENANT_ID = 'cf0fee8c-5cb6-493b-8f02-d4fc045b114b';

    const tenant = await prisma.tenant.upsert({
      where: { slug: 'tenant-cf0fee8c' },
      update: { id: TENANT_ID, orgId: org.id, planId: 'pro' },
      create: {
        id: TENANT_ID,
        slug: 'tenant-cf0fee8c',
        orgId: org.id,
        planId: 'pro',
      },
    });

    console.log('Tenant upserted:', tenant);
  } catch (err) {
    console.error('Error upserting tenant:', err);
  } finally {
    await prisma.$disconnect();
  }
}

run();