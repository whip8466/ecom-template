-- Nested categories + optional icon URL; drop global unique on name (slug stays unique).
ALTER TABLE "categories" DROP CONSTRAINT IF EXISTS "categories_name_key";

ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "parent_id" INTEGER;
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "icon_url" TEXT;

ALTER TABLE "categories"
  ADD CONSTRAINT "categories_parent_id_fkey"
  FOREIGN KEY ("parent_id") REFERENCES "categories"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "categories_parent_id_idx" ON "categories"("parent_id");
