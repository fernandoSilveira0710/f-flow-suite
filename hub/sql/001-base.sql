-- 001-base.sql
-- Seed data for initial plans and entitlements

INSERT INTO "Org" (id, name, "createdAt")
VALUES
  ('00000000-0000-0000-0000-000000000001', '2F Solutions', NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO "Tenant" (id, "orgId", slug, "planId", "createdAt")
VALUES
  ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000001', 'demo', 'starter', NOW())
ON CONFLICT (id) DO NOTHING;
