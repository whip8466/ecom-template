-- Baseline used ON DELETE RESTRICT; Prisma optional relations use SET NULL on delete.
-- Aligns shadow DB (migrate dev) with databases created via prisma db push or schema sync.
ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "products_category_id_fkey";
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
