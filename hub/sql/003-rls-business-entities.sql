-- RLS Policies for Business Entities
-- This file contains Row Level Security policies for all new business entities

-- Enable RLS on all business entity tables
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Sale" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SaleItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "InventoryAdjustment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Customer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Pet" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Service" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Professional" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Appointment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GroomingTicket" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GroomingItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Resource" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CheckIn" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Configuration" ENABLE ROW LEVEL SECURITY;

-- Product RLS Policies
CREATE POLICY "tenant_isolation_product" ON "Product"
  FOR ALL
  USING ("tenantId" = current_setting('app.current_tenant_id', true));

-- Sale RLS Policies
CREATE POLICY "tenant_isolation_sale" ON "Sale"
  FOR ALL
  USING ("tenantId" = current_setting('app.current_tenant_id', true));

-- SaleItem RLS Policies (inherits tenant from Sale)
CREATE POLICY "tenant_isolation_sale_item" ON "SaleItem"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "Sale" 
      WHERE "Sale"."id" = "SaleItem"."saleId" 
      AND "Sale"."tenantId" = current_setting('app.current_tenant_id', true)
    )
  );

-- InventoryAdjustment RLS Policies
CREATE POLICY "tenant_isolation_inventory_adjustment" ON "InventoryAdjustment"
  FOR ALL
  USING ("tenantId" = current_setting('app.current_tenant_id', true));

-- Customer RLS Policies
CREATE POLICY "tenant_isolation_customer" ON "Customer"
  FOR ALL
  USING ("tenantId" = current_setting('app.current_tenant_id', true));

-- Pet RLS Policies
CREATE POLICY "tenant_isolation_pet" ON "Pet"
  FOR ALL
  USING ("tenantId" = current_setting('app.current_tenant_id', true));

-- Service RLS Policies
CREATE POLICY "tenant_isolation_service" ON "Service"
  FOR ALL
  USING ("tenantId" = current_setting('app.current_tenant_id', true));

-- Professional RLS Policies
CREATE POLICY "tenant_isolation_professional" ON "Professional"
  FOR ALL
  USING ("tenantId" = current_setting('app.current_tenant_id', true));

-- Appointment RLS Policies
CREATE POLICY "tenant_isolation_appointment" ON "Appointment"
  FOR ALL
  USING ("tenantId" = current_setting('app.current_tenant_id', true));

-- GroomingTicket RLS Policies
CREATE POLICY "tenant_isolation_grooming_ticket" ON "GroomingTicket"
  FOR ALL
  USING ("tenantId" = current_setting('app.current_tenant_id', true));

-- GroomingItem RLS Policies (inherits tenant from GroomingTicket)
CREATE POLICY "tenant_isolation_grooming_item" ON "GroomingItem"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "GroomingTicket" 
      WHERE "GroomingTicket"."id" = "GroomingItem"."ticketId" 
      AND "GroomingTicket"."tenantId" = current_setting('app.current_tenant_id', true)
    )
  );

-- Resource RLS Policies
CREATE POLICY "tenant_isolation_resource" ON "Resource"
  FOR ALL
  USING ("tenantId" = current_setting('app.current_tenant_id', true));

-- CheckIn RLS Policies
CREATE POLICY "tenant_isolation_check_in" ON "CheckIn"
  FOR ALL
  USING ("tenantId" = current_setting('app.current_tenant_id', true));

-- Configuration RLS Policies
CREATE POLICY "tenant_isolation_configuration" ON "Configuration"
  FOR ALL
  USING ("tenantId" = current_setting('app.current_tenant_id', true));

-- Grant necessary permissions to application role
GRANT SELECT, INSERT, UPDATE, DELETE ON "Product" TO app_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON "Sale" TO app_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON "SaleItem" TO app_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON "InventoryAdjustment" TO app_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON "Customer" TO app_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON "Pet" TO app_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON "Service" TO app_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON "Professional" TO app_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON "Appointment" TO app_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON "GroomingTicket" TO app_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON "GroomingItem" TO app_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON "Resource" TO app_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON "CheckIn" TO app_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON "Configuration" TO app_role;