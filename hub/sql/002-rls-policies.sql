-- 002-rls-policies.sql
-- Enable Row Level Security

ALTER TABLE "Tenant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "License" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Device" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OutboxEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "InboxCommand" ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "Tenant"
  USING (id::text = current_setting('app.current_tenant', true));

CREATE POLICY tenant_isolation_users ON "User"
  USING ("tenantId"::text = current_setting('app.current_tenant', true));

-- Add similar policies for other tables as needed
