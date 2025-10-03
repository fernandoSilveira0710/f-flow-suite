-- Add new fields to Customer and Pet tables

-- Add new fields to Customer table
ALTER TABLE "Customer" ADD COLUMN "documento" TEXT;
ALTER TABLE "Customer" ADD COLUMN "dataNascISO" TIMESTAMP(3);
ALTER TABLE "Customer" ADD COLUMN "tags" TEXT;

-- Rename notes column in Customer table (if needed)
-- ALTER TABLE "Customer" RENAME COLUMN "notes" TO "notes";

-- Add new field to Pet table
ALTER TABLE "Pet" ADD COLUMN "observations" TEXT;

-- Note: weight and birthDate fields already exist in Pet table
-- Note: active field already exists in both tables