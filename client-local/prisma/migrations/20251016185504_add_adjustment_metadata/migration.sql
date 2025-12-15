-- AlterTable
ALTER TABLE "InventoryAdjustment" ADD COLUMN "document" TEXT;
ALTER TABLE "InventoryAdjustment" ADD COLUMN "notes" TEXT;
ALTER TABLE "InventoryAdjustment" ADD COLUMN "unitCost" DECIMAL;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN "imageUrl" TEXT;
