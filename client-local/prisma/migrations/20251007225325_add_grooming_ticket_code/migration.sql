/*
  Warnings:

  - Added the required column `code` to the `GroomingTicket` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GroomingTicket" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "petId" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "professionalId" TEXT,
    "code" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'aberto',
    "total" DECIMAL NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GroomingTicket_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "GroomingTicket_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "GroomingTicket_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_GroomingTicket" ("createdAt", "id", "notes", "petId", "professionalId", "status", "total", "tutorId", "updatedAt") SELECT "createdAt", "id", "notes", "petId", "professionalId", "status", "total", "tutorId", "updatedAt" FROM "GroomingTicket";
DROP TABLE "GroomingTicket";
ALTER TABLE "new_GroomingTicket" RENAME TO "GroomingTicket";
CREATE UNIQUE INDEX "GroomingTicket_code_key" ON "GroomingTicket"("code");
CREATE INDEX "GroomingTicket_petId_idx" ON "GroomingTicket"("petId");
CREATE INDEX "GroomingTicket_tutorId_idx" ON "GroomingTicket"("tutorId");
CREATE INDEX "GroomingTicket_professionalId_idx" ON "GroomingTicket"("professionalId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
