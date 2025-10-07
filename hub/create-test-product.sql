-- Create test product for the test tenant
INSERT INTO "Product" (id, "tenantId", sku, name, description, "salePrice", "costPrice", "stockQty", category, active, "createdAt", "updatedAt") 
VALUES ('prod-1', 'test-tenant-id', 'PROD-001', 'Test Product', 'A test product for sync testing', 100.50, 50.00, 100, 'test', true, NOW(), NOW()) 
ON CONFLICT (id) DO NOTHING;