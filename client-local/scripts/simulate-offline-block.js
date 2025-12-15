const path = require('path');
const os = require('os');

function getLocalDbPath() {
  const home = os.homedir();
  const localAppData = process.env.LOCALAPPDATA || path.join(home, 'AppData', 'Local');
  const dbPath = path.join(localAppData, 'F-Flow Suite', 'data', 'local.db');
  return dbPath;
}

async function main() {
  const tenantId = process.env.TARGET_TENANT_ID || '3cb88e58-b2e7-4fb1-9e0f-eb5a9c4b640b';
  const daysAgo = Number(process.env.OFFLINE_DAYS_AGO || '6');
  const past = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

  const dbPath = getLocalDbPath();
  process.env.DATABASE_URL = `file:${dbPath}`;
  console.log(`[INFO] Using DATABASE_URL=${process.env.DATABASE_URL}`);

  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  try {
    const updated = await prisma.licenseCache.update({
      where: { tenantId },
      data: { lastChecked: past, updatedAt: new Date() },
    });
    console.log(`[OK] Updated licenseCache.lastChecked to ${updated.lastChecked?.toISOString()} for tenant ${tenantId}`);
  } catch (err) {
    console.error('[ERROR] Failed to update lastChecked:', err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();