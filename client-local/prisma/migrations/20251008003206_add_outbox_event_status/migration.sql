/*
  Warnings:

  - Added the required column `updatedAt` to the `OutboxEvent` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_OutboxEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventType" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" DATETIME,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_OutboxEvent" ("createdAt", "eventType", "id", "payload", "processed", "processedAt") SELECT "createdAt", "eventType", "id", "payload", "processed", "processedAt" FROM "OutboxEvent";
DROP TABLE "OutboxEvent";
ALTER TABLE "new_OutboxEvent" RENAME TO "OutboxEvent";
CREATE INDEX "OutboxEvent_processed_idx" ON "OutboxEvent"("processed");
CREATE INDEX "OutboxEvent_eventType_idx" ON "OutboxEvent"("eventType");
CREATE INDEX "OutboxEvent_status_idx" ON "OutboxEvent"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
