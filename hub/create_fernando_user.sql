-- Criar usuário fernando@2fsolutions.com.br
-- Primeiro, vamos usar o tenant 'demo' que já existe
INSERT INTO "User" (id, "tenantId", email, password, "displayName", role, active, "createdAt", "updatedAt") 
VALUES (
  lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))),
  (SELECT id FROM "Tenant" WHERE slug = 'demo' LIMIT 1),
  'fernando@2fsolutions.com.br',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- senha: 123456
  'Fernando',
  'admin',
  true,
  datetime('now'),
  datetime('now')
) 
ON CONFLICT (tenantId, email) DO UPDATE SET
  password = EXCLUDED.password,
  displayName = EXCLUDED.displayName,
  role = EXCLUDED.role,
  active = EXCLUDED.active,
  updatedAt = datetime('now');