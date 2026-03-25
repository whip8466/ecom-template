-- Inventory tracking: in-transit units, last restock time, lifetime received total
ALTER TABLE "products" ADD COLUMN "stock_in_transit" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "products" ADD COLUMN "last_restocked_at" TIMESTAMPTZ(6);
ALTER TABLE "products" ADD COLUMN "total_stock_lifetime" INTEGER NOT NULL DEFAULT 0;

-- Approximate lifetime for existing rows from current on-hand stock
UPDATE "products" SET "total_stock_lifetime" = GREATEST("stock", 0) WHERE "total_stock_lifetime" = 0;
