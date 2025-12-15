const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

async function main() {
  const email = process.env.RESET_EMAIL || 'teste@teste3.com';
  const newPassword = process.env.RESET_PASSWORD || 'SIM';
  const prisma = new PrismaClient();

  try {
    const user = await prisma.user.findFirst({ where: { email } });
    if (!user) {
      console.error(`Usuario com email '${email}' nao encontrado.`);
      process.exit(2);
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    const res = await prisma.user.updateMany({
      where: { email },
      data: { password: hashed },
    });

    console.log(`Senha atualizada para ${res.count} registro(s) do email '${email}'.`);
  } catch (err) {
    console.error('Erro ao redefinir senha:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();