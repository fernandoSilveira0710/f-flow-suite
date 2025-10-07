/*
  Warnings:

  - Added the required column `updatedAt` to the `GroomingTicket` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GroomingItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ticketId" TEXT NOT NULL,
    "serviceId" TEXT,
    "productId" TEXT,
    "name" TEXT NOT NULL,
    "price" DECIMAL NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GroomingItem_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "GroomingTicket" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GroomingItem_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "GroomingItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_GroomingItem" ("id", "name", "price", "productId", "qty", "serviceId", "ticketId") SELECT "id", "name", "price", "productId", "qty", "serviceId", "ticketId" FROM "GroomingItem";
DROP TABLE "GroomingItem";
ALTER TABLE "new_GroomingItem" RENAME TO "GroomingItem";
CREATE INDEX "GroomingItem_ticketId_idx" ON "GroomingItem"("ticketId");
CREATE INDEX "GroomingItem_serviceId_idx" ON "GroomingItem"("serviceId");
CREATE INDEX "GroomingItem_productId_idx" ON "GroomingItem"("productId");
CREATE TABLE "new_GroomingTicket" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "petId" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "professionalId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'aberto',
    "total" DECIMAL NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GroomingTicket_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "GroomingTicket_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "GroomingTicket_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_GroomingTicket" ("createdAt", "id", "petId", "status", "tutorId") SELECT "createdAt", "id", "petId", "status", "tutorId" FROM "GroomingTicket";
DROP TABLE "GroomingTicket";
ALTER TABLE "new_GroomingTicket" RENAME TO "GroomingTicket";
CREATE INDEX "GroomingTicket_petId_idx" ON "GroomingTicket"("petId");
CREATE INDEX "GroomingTicket_tutorId_idx" ON "GroomingTicket"("tutorId");
CREATE INDEX "GroomingTicket_professionalId_idx" ON "GroomingTicket"("professionalId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
