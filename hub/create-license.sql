-- Criar licença para tenant-1
INSERT INTO "License" ("id", "tenantId", "planKey", "status", "maxSeats", "expiry", "graceDays", "createdAt", "updatedAt") 
VALUES (gen_random_uuid(), 'tenant-1', 'starter', 'active', 5, '2025-12-31T23:59:59.000Z', 7, NOW(), NOW()) 
ON CONFLICT ("tenantId") DO UPDATE SET
  "planKey" = EXCLUDED."planKey",
  "status" = EXCLUDED."status",
  "maxSeats" = EXCLUDED."maxSeats",
  "expiry" = EXCLUDED."expiry",
  "graceDays" = EXCLUDED."graceDays",
  "updatedAt" = NOW();

-- Criar entitlements para o plano starter
INSERT INTO "Entitlement" ("id", "planKey", "key", "value") 
VALUES 
  (gen_random_uuid(), 'starter', 'POS', 'true'),
  (gen_random_uuid(), 'starter', 'INVENTORY', 'true'),
  (gen_random_uuid(), 'starter', 'CUSTOMERS', 'true'),
  (gen_random_uuid(), 'starter', 'PETS', 'true'),
  (gen_random_uuid(), 'starter', 'SERVICES', 'true'),
  (gen_random_uuid(), 'starter', 'PROFESSIONALS', 'true'),
  (gen_random_uuid(), 'starter', 'APPOINTMENTS', 'true'),
  (gen_random_uuid(), 'starter', 'GROOMING', 'true')
ON CONFLICT ("planKey", "key") DO UPDATE SET
  "value" = EXCLUDED."value";