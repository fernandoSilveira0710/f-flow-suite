/*
  Warnings:

  - You are about to drop the column `aggregate` on the `OutboxEvent` table. All the data in the column will be lost.
  - You are about to drop the column `aggregateId` on the `OutboxEvent` table. All the data in the column will be lost.
  - You are about to drop the column `occurredAt` on the `OutboxEvent` table. All the data in the column will be lost.
  - You are about to drop the column `retryCount` on the `OutboxEvent` table. All the data in the column will be lost.
  - You are about to drop the column `sentAt` on the `OutboxEvent` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `OutboxEvent` table. All the data in the column will be lost.
  - Added the required column `eventType` to the `OutboxEvent` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "documento" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "dataNascISO" DATETIME,
    "tags" TEXT,
    "notes" TEXT,
    "address" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Customer" ("address", "createdAt", "email", "id", "name", "phone", "updatedAt") SELECT "address", "createdAt", "email", "id", "name", "phone", "updatedAt" FROM "Customer";
DROP TABLE "Customer";
ALTER TABLE "new_Customer" RENAME TO "Customer";
CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");
CREATE TABLE "new_OutboxEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventType" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" DATETIME
);
INSERT INTO "new_OutboxEvent" ("createdAt", "id", "payload") SELECT "createdAt", "id", "payload" FROM "OutboxEvent";
DROP TABLE "OutboxEvent";
ALTER TABLE "new_OutboxEvent" RENAME TO "OutboxEvent";
CREATE INDEX "OutboxEvent_processed_idx" ON "OutboxEvent"("processed");
CREATE INDEX "OutboxEvent_eventType_idx" ON "OutboxEvent"("eventType");
CREATE TABLE "new_Pet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tutorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "species" TEXT NOT NULL,
    "breed" TEXT,
    "weight" DECIMAL,
    "birthDate" DATETIME,
    "observations" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Pet_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Pet" ("birthDate", "breed", "createdAt", "id", "name", "species", "tutorId", "updatedAt", "weight") SELECT "birthDate", "breed", "createdAt", "id", "name", "species", "tutorId", "updatedAt", "weight" FROM "Pet";
DROP TABLE "Pet";
ALTER TABLE "new_Pet" RENAME TO "Pet";
CREATE INDEX "Pet_tutorId_idx" ON "Pet"("tutorId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
