-- Add stockQty column to Product table
PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;

-- SQLite does not support direct ALTER TABLE ADD COLUMN with NOT NULL without default,
-- but we can add an INT column with default 0 safely.
ALTER TABLE Product ADD COLUMN stockQty INTEGER NOT NULL DEFAULT 0;

COMMIT;
PRAGMA foreign_keys=ON;