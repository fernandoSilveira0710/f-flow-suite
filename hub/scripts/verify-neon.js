const { PrismaClient } = require('@prisma/client');

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('[ERROR] DATABASE_URL não definida. Configure a URL do Neon.');
    process.exit(1);
  }
  console.log('[INFO] Testando conexão com DATABASE_URL=', url);

  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });

  try {
    // Conecta e executa algumas consultas simples
    await prisma.$connect();
    const version = await prisma.$queryRaw`SELECT version()`;
    const now = await prisma.$queryRaw`SELECT now()`;
    const whoami = await prisma.$queryRaw`SELECT current_user, current_database()`;

    console.log('✅ Conectado ao Postgres (Neon).');
    console.log('version:', version[0]?.version);
    console.log('now:', now[0]?.now?.toISOString?.() || now[0]?.now);
    console.log('user/db:', whoami[0]);

    // Retorna OK explícito
    const ok = await prisma.$queryRaw`SELECT 1 AS ok`;
    console.log('select ok:', ok[0]?.ok);
  } catch (err) {
    console.error('❌ Falha ao conectar ou consultar:', err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();