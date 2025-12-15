const path = require('path');
const os = require('os');

function getLocalDbPath() {
  const home = os.homedir();
  const localAppData = process.env.LOCALAPPDATA || path.join(home, 'AppData', 'Local');
  const dbPath = path.join(localAppData, 'F-Flow Suite', 'data', 'local.db');
  return dbPath;
}

async function main() {
  const email = process.env.TARGET_EMAIL || 'teste@teste3.com';
  const passOk = process.env.TARGET_PASSWORD_OK || '123456';
  const passBad = process.env.TARGET_PASSWORD_BAD || 'wrongpass';

  const dbPath = getLocalDbPath();
  process.env.DATABASE_URL = `file:${dbPath}`;
  console.log(`[INFO] Using DATABASE_URL=${process.env.DATABASE_URL}`);

  const { PrismaService } = require(path.join(__dirname, '..', 'dist', 'common', 'prisma', 'prisma.service.js'));
  const { AuthService } = require(path.join(__dirname, '..', 'dist', 'auth', 'auth.service.js'));

  const prisma = new PrismaService();
  await prisma.onModuleInit?.();
  const auth = new AuthService(prisma);

  try {
    const resOk = await auth.authenticateOffline(email, passOk);
    console.log('[RESULT OK]', JSON.stringify(resOk, null, 2));

    const resBad = await auth.authenticateOffline(email, passBad);
    console.log('[RESULT BAD]', JSON.stringify(resBad, null, 2));
  } catch (err) {
    console.error('[ERROR] Test offline login failed:', err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect?.();
  }
}

main();