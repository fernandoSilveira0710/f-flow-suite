require('dotenv').config();
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function resetUserPassword(email, newPassword) {
  try {
    console.log(`Resetando senha para usuário: ${email}`);

    const user = await prisma.user.findFirst({ where: { email } });
    if (!user) {
      console.error('Usuário não encontrado.');
      return 1;
    }

    const hash = await bcrypt.hash(newPassword, 10);
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { password: hash },
    });

    console.log('Senha atualizada com sucesso para usuário:', updated.email);
    return 0;
  } catch (err) {
    console.error('Erro ao resetar senha:', err);
    return 2;
  } finally {
    await prisma.$disconnect();
  }
}

// Executa via CLI: node reset_user_password.js teste@teste3.com 123456
const [,, emailArg, passArg] = process.argv;
if (!emailArg || !passArg) {
  console.error('Uso: node reset_user_password.js <email> <nova_senha>');
  process.exit(64);
}

resetUserPassword(emailArg, passArg).then(code => process.exit(code));