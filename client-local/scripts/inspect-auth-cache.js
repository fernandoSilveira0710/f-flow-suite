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
  const email = process.env.TARGET_EMAIL || 'teste@teste3.com';

  const dbPath = getLocalDbPath();
  process.env.DATABASE_URL = `file:${dbPath}`;
  console.log(`[INFO] Using DATABASE_URL=${process.env.DATABASE_URL}`);

  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.log(`[WARN] No user found for email ${email}`);
      return;
    }
    console.log(`[OK] Found user id=${user.id} tenantId=${user.tenantId}`);

    const authCache = await prisma.authCache.findUnique({ where: { userId: user.id } });
    if (!authCache) {
      console.log(`[WARN] No AuthCache for userId ${user.id}`);
      return;
    }
    console.log(`[OK] AuthCache email=${authCache.email}`);
    console.log(`passwordHash=${authCache.passwordHash}`);

    const extraEnv = process.env.EXTRA_PASSWORDS || 'Feeh@1993';
    const extraList = extraEnv.split(',').map(s => s.trim()).filter(Boolean);
    const tests = ['123456', 'wrongpass', ...extraList];
    for (const t of tests) {
      const ok = await bcrypt.compare(t, authCache.passwordHash);
      console.log(`compare('${t}', hash) => ${ok}`);
    }
  } catch (err) {
    console.error('[ERROR] Failed to inspect auth cache:', err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();