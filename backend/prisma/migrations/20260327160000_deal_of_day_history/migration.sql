CREATE TABLE "deal_of_day_history" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "deal_price_cents" INTEGER NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "activated_at" TIMESTAMPTZ(6) NOT NULL,
    "ends_at" TIMESTAMPTZ(6) NOT NULL,
    "ended_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deal_of_day_history_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "deal_of_day_history_product_id_idx" ON "deal_of_day_history"("product_id");
CREATE INDEX "deal_of_day_history_ended_at_idx" ON "deal_of_day_history"("ended_at");

ALTER TABLE "deal_of_day_history" ADD CONSTRAINT "deal_of_day_history_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
