-- CreateTable
CREATE TABLE "InventoryAdjustment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "productSku" TEXT,
    "delta" INTEGER NOT NULL,
    "reason" TEXT,
    "previousStock" INTEGER,
    "newStock" INTEGER,
    "adjustedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InventoryAdjustment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "InventoryAdjustment_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "InventoryAdjustment_tenantId_productId_idx" ON "InventoryAdjustment"("tenantId", "productId");

-- CreateIndex
CREATE INDEX "InventoryAdjustment_tenantId_adjustedAt_idx" ON "InventoryAdjustment"("tenantId", "adjustedAt");
