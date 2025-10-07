-- Create test organization and tenant for SQLite
INSERT OR IGNORE INTO "Org" (id, name, createdAt) 
VALUES ('test-org-id', 'Test Org', datetime('now'));

INSERT OR IGNORE INTO "Tenant" (id, orgId, slug, planId, createdAt) 
VALUES ('tenant-1', 'test-org-id', 'test-tenant', 'pro', datetime('now'));