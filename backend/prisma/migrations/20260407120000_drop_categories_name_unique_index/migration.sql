-- Baseline used CREATE UNIQUE INDEX; DROP CONSTRAINT does not remove it. Align with category_tree intent.
DROP INDEX IF EXISTS "categories_name_key";
