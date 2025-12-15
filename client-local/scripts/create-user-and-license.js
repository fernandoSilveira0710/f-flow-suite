// Creates/updates a local user and license cache in the actual runtime DB
const path = require('path');
const os = require('os');
const bcrypt = require('bcrypt');

function getLocalDbPath() {
  const home = os.homedir();
  const localAppData = process.env.LOCALAPPDATA || path.join(home, 'AppData', 'Local');
  const dbPath = path.join(localAppData, 'F-Flow Suite', 'data', 'local.db');
  return dbPath;
}

async function main() {
  const tenantId = process.env.TARGET_TENANT_ID || '3cb88e58-b2e7-4fb1-9e0f-eb5a9c4b640b';
  const email = process.env.TARGET_EMAIL || 'teste@teste3.com';
  const displayName = process.env.TARGET_DISPLAY_NAME || 'Teste 3';
  const role = process.env.TARGET_ROLE || 'user';
  const plainPassword = process.env.TARGET_PASSWORD || '123456';

  const dbPath = getLocalDbPath();
  process.env.DATABASE_URL = `file:${dbPath}`;

  console.log(`[INFO] Using DATABASE_URL=${process.env.DATABASE_URL}`);

  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  try {
    // Ensure user exists and is active under the tenant
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        displayName,
        role,
        active: true,
        tenantId,
      },
      create: {
        email,
        displayName,
        role,
        active: true,
        tenantId,
      },
    });
    console.log(`[OK] Upserted user ${email} with id=${user.id} tenantId=${tenantId}`);

    // Seed AuthCache with hashed password for offline validation in tests
    const passwordHash = await bcrypt.hash(plainPassword, 10);
    await prisma.authCache.upsert({
      where: { userId: user.id },
      update: {
        email,
        passwordHash,
        lastHubAuthAt: new Date(),
      },
      create: {
        userId: user.id,
        email,
        passwordHash,
        lastHubAuthAt: new Date(),
      },
    });
    console.log(`[OK] Seeded AuthCache for ${email} (password set for offline tests)`);

    // Ensure license cache is present and valid for the tenant
    const future = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // +1 year
    const now = new Date();
    const license = await prisma.licenseCache.upsert({
      where: { tenantId },
      update: {
        registered: true,
        licensed: true,
        status: 'active',
        planKey: 'max',
        maxSeats: 10,
        expiresAt: future,
        graceDays: 7,
        lastChecked: now,
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
        lastChecked: now,
      },
    });
    console.log(`[OK] Upserted license cache for tenant=${tenantId} expiresAt=${license.expiresAt?.toISOString()}`);

  } catch (err) {
    console.error('[ERROR] Failed to create user/license:', err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();