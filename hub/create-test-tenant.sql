-- Create test organization and tenant
INSERT INTO "Org" (id, name, "createdAt") 
VALUES ('test-org-id', 'Test Org', NOW()) 
ON CONFLICT (name) DO NOTHING;

INSERT INTO "Tenant" (id, "orgId", slug, "planId", "createdAt") 
VALUES ('tenant-1', 'test-org-id', 'test-tenant', 'pro', NOW()) 
ON CONFLICT (slug) DO NOTHING;