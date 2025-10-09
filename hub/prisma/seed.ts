import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type SeedEntitlement = { planKey: string; key: string; value: string };

type SeedPaymentMethod = {
  tenantId: string;
  name: string;
  type: string;
  active: boolean;
};

async function main() {
  const org = await prisma.org.upsert({
    where: { name: '2F Demo' },
    update: {},
    create: { name: '2F Demo' },
  });

  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      slug: 'demo',
      orgId: org.id,
      planId: 'pro',
    },
  });

  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 30);

  await prisma.license.upsert({
    where: { tenantId: tenant.id },
    update: {
      expiry,
      status: 'trial',
    },
    create: {
      id: tenant.id,
      tenantId: tenant.id,
      status: 'trial',
      planKey: 'pro',
      maxSeats: 5,
      expiry,
      graceDays: 7,
    },
  });

  // Entitlements para todos os planos
  const entitlements: SeedEntitlement[] = [
    // Starter Plan (R$ 19,99)
    { planKey: 'starter', key: 'products', value: 'true' },
    { planKey: 'starter', key: 'pdv', value: 'true' },
    { planKey: 'starter', key: 'stock', value: 'true' },
    { planKey: 'starter', key: 'dashboards', value: 'true' },
    { planKey: 'starter', key: 'agenda', value: 'false' },
    { planKey: 'starter', key: 'banho_tosa', value: 'false' },
    { planKey: 'starter', key: 'reports', value: 'false' },
    { planKey: 'starter', key: 'max_users', value: '1' },
    
    // Pro Plan (R$ 49,99)
    { planKey: 'pro', key: 'products', value: 'true' },
    { planKey: 'pro', key: 'pdv', value: 'true' },
    { planKey: 'pro', key: 'stock', value: 'true' },
    { planKey: 'pro', key: 'dashboards', value: 'true' },
    { planKey: 'pro', key: 'agenda', value: 'true' },
    { planKey: 'pro', key: 'banho_tosa', value: 'true' },
    { planKey: 'pro', key: 'reports', value: 'false' },
    { planKey: 'pro', key: 'max_users', value: '5' },
    
    // Max Plan (R$ 99,99)
    { planKey: 'max', key: 'products', value: 'true' },
    { planKey: 'max', key: 'pdv', value: 'true' },
    { planKey: 'max', key: 'stock', value: 'true' },
    { planKey: 'max', key: 'dashboards', value: 'true' },
    { planKey: 'max', key: 'agenda', value: 'true' },
    { planKey: 'max', key: 'banho_tosa', value: 'true' },
    { planKey: 'max', key: 'reports', value: 'true' },
    { planKey: 'max', key: 'max_users', value: '15' },
  ];

  for (const entitlement of entitlements) {
    await prisma.entitlement.upsert({
      where: {
        planKey_key: {
          planKey: entitlement.planKey,
          key: entitlement.key,
        },
      },
      update: {
        value: entitlement.value,
      },
      create: entitlement,
    });
  }

  const paymentMethods: SeedPaymentMethod[] = [
    { tenantId: tenant.id, name: 'Dinheiro', type: 'CASH', active: true },
    { tenantId: tenant.id, name: 'PIX', type: 'PIX', active: true },
    { tenantId: tenant.id, name: 'Débito', type: 'DEBIT_CARD', active: true },
    { tenantId: tenant.id, name: 'Crédito', type: 'CREDIT_CARD', active: true },
  ];

  for (const method of paymentMethods) {
    await prisma.paymentMethod.upsert({
      where: {
        tenantId_name: {
          tenantId: method.tenantId,
          name: method.name,
        },
      },
      update: {
        type: method.type,
        active: method.active,
      },
      create: method,
    });
  }

  console.log('Seed concluído. tenant.slug=demo, tenant.id=', tenant.id);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
