const { PrismaClient } = require('@prisma/client');

async function run() {
  const prisma = new PrismaClient();
  const tenantId = process.env.TENANT_ID || '3cb88e58-b2e7-4fb1-9e0f-eb5a9c4b640b';
  const future = new Date('2026-10-10T13:05:30.330Z');
  try {
    const result = await prisma.licenseCache.upsert({
      where: { tenantId },
      update: {
        registered: true,
        licensed: true,
        status: 'active',
        planKey: 'max',
        maxSeats: 10,
        expiresAt: future,
        graceDays: 7,
        lastChecked: new Date(),
        updatedAt: new Date(),
      },
      create: {
        tenantId,
        registered: true,
        licensed: true,
        status: 'active',
        planKey: 'max',
        maxSeats: 10,
        expiresAt: future,
        graceDays: 7,
        lastChecked: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    console.log('✅ Updated dev DB license cache to future expiry for tenant:', tenantId);
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('❌ Failed to update dev cache', err);
  } finally {
    await prisma.$disconnect();
  }
}

run();