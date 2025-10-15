require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function checkData() {
  const prisma = new PrismaClient();
  
  try {
    const tenants = await prisma.tenant.findMany();
    console.log('Tenants:', tenants);
    
    const orgs = await prisma.org.findMany();
    console.log('Orgs:', orgs);
    
    const licenses = await prisma.license.findMany();
    console.log('Licenses:', licenses);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();