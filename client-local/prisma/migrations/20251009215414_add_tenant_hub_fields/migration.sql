-- AlterTable
ALTER TABLE "User" ADD COLUMN "hubUserId" TEXT;
ALTER TABLE "User" ADD COLUMN "tenantId" TEXT;

-- CreateTable
CREATE TABLE "LicenseCache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "registered" BOOLEAN NOT NULL DEFAULT false,
    "licensed" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL,
    "planKey" TEXT,
    "maxSeats" INTEGER,
    "expiresAt" DATETIME,
    "graceDays" INTEGER DEFAULT 7,
    "lastChecked" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "LicenseCache_tenantId_key" ON "LicenseCache"("tenantId");

-- CreateIndex
CREATE INDEX "LicenseCache_tenantId_idx" ON "LicenseCache"("tenantId");

-- CreateIndex
CREATE INDEX "LicenseCache_status_idx" ON "LicenseCache"("status");

-- CreateIndex
CREATE INDEX "LicenseCache_lastChecked_idx" ON "LicenseCache"("lastChecked");

-- CreateIndex
CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");
