-- CreateTable
CREATE TABLE "promo_banners" (
    "id" SERIAL NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "eyebrow_label" VARCHAR(200) NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "subtitle" VARCHAR(500),
    "image_url" VARCHAR(2000),
    "image_alt" VARCHAR(500) NOT NULL DEFAULT '',
    "cta_label" VARCHAR(120) NOT NULL DEFAULT 'Shop Now',
    "cta_href" VARCHAR(500) NOT NULL DEFAULT '/shop',
    "style_variant" VARCHAR(20) NOT NULL DEFAULT 'neutral',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "promo_banners_pkey" PRIMARY KEY ("id")
);
