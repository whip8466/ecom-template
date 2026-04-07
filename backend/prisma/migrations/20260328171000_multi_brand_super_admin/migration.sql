-- Multi-brand: tenant brands, users scoped to a brand, contact_settings per brand.

CREATE TABLE "brands" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(64) NOT NULL,
    "is_blocked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "brands_slug_key" ON "brands"("slug");

INSERT INTO "brands" ("id", "name", "slug", "is_blocked", "created_at", "updated_at")
VALUES (1, 'Dhidi', 'dhidi', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

UPDATE "brands" SET "name" = COALESCE((SELECT "brand_name" FROM "contact_settings" WHERE "id" = 1 LIMIT 1), "name") WHERE "id" = 1;

SELECT setval(pg_get_serial_sequence('brands', 'id'), (SELECT MAX("id") FROM "brands"));

ALTER TABLE "contact_settings" ADD COLUMN "brand_id" INTEGER;

UPDATE "contact_settings" SET "brand_id" = 1 WHERE "id" = 1;

ALTER TABLE "contact_settings" ALTER COLUMN "brand_id" SET NOT NULL;

ALTER TABLE "contact_settings" ADD CONSTRAINT "contact_settings_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "contact_settings_brand_id_key" ON "contact_settings"("brand_id");

ALTER TABLE "contact_settings" ALTER COLUMN "id" DROP DEFAULT;

CREATE SEQUENCE IF NOT EXISTS "contact_settings_id_seq";
SELECT setval('contact_settings_id_seq', COALESCE((SELECT MAX("id") FROM "contact_settings"), 1));
ALTER TABLE "contact_settings" ALTER COLUMN "id" SET DEFAULT nextval('contact_settings_id_seq');
ALTER SEQUENCE "contact_settings_id_seq" OWNED BY "contact_settings"."id";

ALTER TABLE "users" ADD COLUMN "brand_id" INTEGER;

ALTER TABLE "users" ADD CONSTRAINT "users_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "users_brand_id_idx" ON "users"("brand_id");

UPDATE "users" SET "brand_id" = 1 WHERE "role" IN ('ADMIN', 'MANAGER') AND "brand_id" IS NULL;
