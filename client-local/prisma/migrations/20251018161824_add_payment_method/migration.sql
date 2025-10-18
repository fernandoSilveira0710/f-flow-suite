-- CreateTable
CREATE TABLE "PaymentMethod" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "jurosPorParcelaPct" REAL,
    "descontoFixoPct" REAL,
    "taxaFixa" REAL,
    "integrationSettings" TEXT,
    "valorMin" REAL,
    "valorMax" REAL,
    "visivelSomenteParaRoles" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "PaymentMethod_tenantId_active_idx" ON "PaymentMethod"("tenantId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentMethod_tenantId_name_key" ON "PaymentMethod"("tenantId", "name");
