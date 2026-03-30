ALTER TABLE "deal_of_day_products"
  ADD COLUMN "deal_price_cents" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "duration_minutes" INTEGER NOT NULL DEFAULT 60,
  ADD COLUMN "activated_at" TIMESTAMPTZ(6),
  ADD COLUMN "ends_at" TIMESTAMPTZ(6);

UPDATE "deal_of_day_products" AS d
SET "deal_price_cents" = p."price_cents"
FROM "products" AS p
WHERE d."product_id" = p."id" AND d."deal_price_cents" = 0;
