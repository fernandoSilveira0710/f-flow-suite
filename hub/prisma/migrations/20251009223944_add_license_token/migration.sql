-- CreateTable
CREATE TABLE "LicenseToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "issuedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "revokedAt" DATETIME,
    CONSTRAINT "LicenseToken_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "License" ("tenantId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "LicenseToken_tenantId_idx" ON "LicenseToken"("tenantId");

-- CreateIndex
CREATE INDEX "LicenseToken_deviceId_idx" ON "LicenseToken"("deviceId");

-- CreateIndex
CREATE INDEX "LicenseToken_expiresAt_idx" ON "LicenseToken"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "LicenseToken_tenantId_deviceId_key" ON "LicenseToken"("tenantId", "deviceId");
