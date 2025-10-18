-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PaymentMethod" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "permiteTroco" BOOLEAN NOT NULL DEFAULT false,
    "permiteParcelas" BOOLEAN NOT NULL DEFAULT false,
    "maxParcelas" INTEGER,
    "jurosPorParcelaPct" REAL,
    "descontoFixoPct" REAL,
    "taxaFixa" REAL,
    "integrationSettings" TEXT,
    "valorMin" REAL,
    "valorMax" REAL,
    "mostrarNoPDV" BOOLEAN NOT NULL DEFAULT true,
    "somenteSeCaixaAberto" BOOLEAN NOT NULL DEFAULT true,
    "contabilizaNoCaixa" BOOLEAN NOT NULL DEFAULT true,
    "permiteSangria" BOOLEAN NOT NULL DEFAULT false,
    "visivelSomenteParaRoles" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_PaymentMethod" ("active", "createdAt", "descontoFixoPct", "id", "integrationSettings", "jurosPorParcelaPct", "name", "taxaFixa", "tenantId", "type", "updatedAt", "valorMax", "valorMin", "visivelSomenteParaRoles") SELECT "active", "createdAt", "descontoFixoPct", "id", "integrationSettings", "jurosPorParcelaPct", "name", "taxaFixa", "tenantId", "type", "updatedAt", "valorMax", "valorMin", "visivelSomenteParaRoles" FROM "PaymentMethod";
DROP TABLE "PaymentMethod";
ALTER TABLE "new_PaymentMethod" RENAME TO "PaymentMethod";
CREATE INDEX "PaymentMethod_tenantId_active_idx" ON "PaymentMethod"("tenantId", "active");
CREATE UNIQUE INDEX "PaymentMethod_tenantId_name_key" ON "PaymentMethod"("tenantId", "name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
