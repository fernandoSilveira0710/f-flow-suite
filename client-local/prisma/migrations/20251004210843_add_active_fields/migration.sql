-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Professional" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Professional" ("createdAt", "id", "name", "role", "updatedAt") SELECT "createdAt", "id", "name", "role", "updatedAt" FROM "Professional";
DROP TABLE "Professional";
ALTER TABLE "new_Professional" RENAME TO "Professional";
CREATE TABLE "new_Service" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL NOT NULL,
    "duration" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Service" ("createdAt", "description", "duration", "id", "name", "price", "updatedAt") SELECT "createdAt", "description", "duration", "id", "name", "price", "updatedAt" FROM "Service";
DROP TABLE "Service";
ALTER TABLE "new_Service" RENAME TO "Service";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
