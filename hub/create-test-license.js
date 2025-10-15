require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function createTestLicense() {
  const prisma = new PrismaClient();
  
  try {
    // Skip org and tenant creation, just create/update the license
    console.log('Creating/updating license for tenant 00000000-0000-0000-0000-000000000001...');
    
    // Create license with 'max' plan
    const license = await prisma.license.upsert({
      where: { tenantId: '00000000-0000-0000-0000-000000000001' },
      update: {
        planKey: 'max',
        status: 'active',
        maxSeats: 10,
        expiry: new Date('2025-12-31T23:59:59.000Z'),
        graceDays: 7
      },
      create: {
        tenantId: '00000000-0000-0000-0000-000000000001',
        planKey: 'max',
        status: 'active',
        maxSeats: 10,
        expiry: new Date('2025-12-31T23:59:59.000Z'),
        graceDays: 7
      }
    });
    
    console.log('License created/updated:', license);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestLicense();