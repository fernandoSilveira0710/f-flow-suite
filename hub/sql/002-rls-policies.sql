-- 002-rls-policies.sql
-- Habilita RLS e define policies baseadas no tenant setado em app.tenant_id

ALTER TABLE "User"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Tenant"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "License"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Device"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PaymentMethod" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OutboxEvent"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "InboxCommand"  ENABLE ROW LEVEL SECURITY;

-- POLICY: usuários enxergam apenas dados do próprio tenant
CREATE POLICY p_user_tenant
  ON "User"
  USING ("tenantId" = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY p_tenant_self
  ON "Tenant"
  USING (id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY p_license_tenant
  ON "License"
  USING ("tenantId" = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY p_device_tenant
  ON "Device"
  USING ("tenantId" = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY p_paymentmethod_tenant
  ON "PaymentMethod"
  USING ("tenantId" = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY p_outboxevent_tenant
  ON "OutboxEvent"
  USING ("tenantId" = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY p_inboxcommand_tenant
  ON "InboxCommand"
  USING ("tenantId" = current_setting('app.tenant_id', true)::uuid);
