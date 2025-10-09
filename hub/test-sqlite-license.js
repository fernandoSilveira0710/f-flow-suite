const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testLicenseActivation() {
  try {
    console.log('Testando ativação de licença com SQLite...');

    // Primeiro, vamos usar o tenant que foi criado pelo seed
    const existingTenant = await prisma.tenant.findFirst({
      where: { slug: 'demo' }
    });

    if (!existingTenant) {
      console.log('Nenhum tenant encontrado. Criando tenant de teste...');
      
      // Criar org primeiro
      const org = await prisma.org.create({
        data: {
          name: 'Test Org'
        }
      });

      // Criar tenant
      const tenant = await prisma.tenant.create({
        data: {
          slug: 'tenant-1',
          orgId: org.id,
          planId: 'pro'
        }
      });

      console.log('Tenant criado:', tenant.id);
      
      // Criar licença para o novo tenant
      const newLicense = await prisma.license.create({
        data: {
          tenantId: tenant.id,
          planKey: 'pro',
          status: 'active',
          maxSeats: 5,
          expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
          graceDays: 7
        }
      });

      console.log('Licença criada:', newLicense);
    } else {
      console.log('Usando tenant existente:', existingTenant.id);
      
      // Verificar se já existe licença
      const existingLicense = await prisma.license.findUnique({
        where: { tenantId: existingTenant.id }
      });

      if (existingLicense) {
        console.log('Licença existente encontrada:', existingLicense);
      } else {
        console.log('Criando licença para tenant existente...');
        const newLicense = await prisma.license.create({
          data: {
            tenantId: existingTenant.id,
            planKey: 'pro',
            status: 'active',
            maxSeats: 5,
            expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
            graceDays: 7
          }
        });
        console.log('Licença criada:', newLicense);
      }
    }

    // Testar busca de licença
    const license = await prisma.license.findFirst({
      include: {
        tenant: true
      }
    });

    console.log('Licença encontrada:', license);
    console.log('Teste de ativação de licença concluído com sucesso!');

  } catch (error) {
    console.error('Erro testando licença:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLicenseActivation();