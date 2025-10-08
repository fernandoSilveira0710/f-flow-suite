const { PrismaClient } = require('@prisma/client');

async function debugTenantValidation() {
  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    console.log('Connected to database');
    
    const tenantId = 'tenant-1';
    
    // Verificar se o tenant existe
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    });
    
    console.log('Tenant exists:', tenant ? 'YES' : 'NO');
    if (tenant) {
      console.log('Tenant details:', tenant);
    }
    
    // Verificar se há alguma constraint ou trigger que pode estar causando o problema
    const constraints = await prisma.$queryRaw`
      SELECT 
        tc.constraint_name, 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name = 'Resource'
        AND kcu.column_name = 'tenantId';
    `;
    
    console.log('Foreign key constraints on Resource.tenantId:', constraints);
    
    // Verificar se há policies RLS ativas
    const policies = await prisma.$queryRaw`
      SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
      FROM pg_policies 
      WHERE tablename IN ('Resource', 'Tenant');
    `;
    
    console.log('RLS Policies:', policies);
    
    // Verificar se RLS está habilitado
    const rlsStatus = await prisma.$queryRaw`
      SELECT schemaname, tablename, rowsecurity, forcerowsecurity
      FROM pg_tables 
      WHERE tablename IN ('Resource', 'Tenant');
    `;
    
    console.log('RLS Status:', rlsStatus);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugTenantValidation();