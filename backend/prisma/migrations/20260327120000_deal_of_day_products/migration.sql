-- Curated "Deal of the Day" products on the home page (max 4, ordered by sort_order).

CREATE TABLE "deal_of_day_products" (
    "id" SERIAL NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,

    CONSTRAINT "deal_of_day_products_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "deal_of_day_products_sort_order_key" ON "deal_of_day_products"("sort_order");
CREATE UNIQUE INDEX "deal_of_day_products_product_id_key" ON "deal_of_day_products"("product_id");

ALTER TABLE "deal_of_day_products"
  ADD CONSTRAINT "deal_of_day_products_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
