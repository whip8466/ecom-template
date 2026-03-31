-- Moderation: new reviews start PENDING; existing reviews remain visible (APPROVED).
ALTER TABLE "product_reviews" ADD COLUMN "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING';

UPDATE "product_reviews" SET "status" = 'APPROVED';

CREATE INDEX "product_reviews_status_idx" ON "product_reviews"("status");
