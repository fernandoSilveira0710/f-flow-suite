-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sku" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "salePrice" DECIMAL NOT NULL,
    "costPrice" DECIMAL,
    "stockQty" INTEGER NOT NULL DEFAULT 0,
    "category" TEXT,
    "barcode" TEXT,
    "unit" TEXT,
    "minStock" INTEGER,
    "maxStock" INTEGER,
    "trackStock" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Product" ("active", "barcode", "category", "costPrice", "createdAt", "description", "id", "name", "salePrice", "sku", "stockQty", "updatedAt") SELECT "active", "barcode", "category", "costPrice", "createdAt", "description", "id", "name", "salePrice", "sku", "stockQty", "updatedAt" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");
CREATE UNIQUE INDEX "Product_barcode_key" ON "Product"("barcode");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
