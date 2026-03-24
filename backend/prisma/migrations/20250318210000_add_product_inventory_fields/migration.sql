ALTER TABLE "products" ADD COLUMN "sale_price_cents" INTEGER;
ALTER TABLE "products" ADD COLUMN "fulfillment_type" VARCHAR(32);
ALTER TABLE "products" ADD COLUMN "external_product_id_type" VARCHAR(20);
ALTER TABLE "products" ADD COLUMN "external_product_id" VARCHAR(120);
