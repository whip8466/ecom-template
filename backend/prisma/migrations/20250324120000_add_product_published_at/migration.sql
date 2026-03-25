-- AlterTable
ALTER TABLE "products" ADD COLUMN "published_at" TIMESTAMPTZ(6);

-- Approximate publish time for existing published rows (first publish was not tracked before)
UPDATE "products"
SET "published_at" = "created_at"
WHERE "status" = 'PUBLISHED' AND "published_at" IS NULL;
