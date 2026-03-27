-- CreateTable
CREATE TABLE "home_banner_slides" (
    "id" SERIAL NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "price_line" VARCHAR(500) NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "offer_prefix" VARCHAR(500) NOT NULL DEFAULT '',
    "offer_highlight" VARCHAR(200) NOT NULL,
    "offer_suffix" VARCHAR(500) NOT NULL DEFAULT '',
    "image_url" VARCHAR(2000) NOT NULL,
    "image_alt" VARCHAR(500) NOT NULL DEFAULT '',
    "cta_href" VARCHAR(500) NOT NULL DEFAULT '/shop',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "home_banner_slides_pkey" PRIMARY KEY ("id")
);

-- Seed defaults (matches previous storefront hardcoded slides)
INSERT INTO "home_banner_slides" ("sort_order", "price_line", "title", "offer_prefix", "offer_highlight", "offer_suffix", "image_url", "image_alt", "cta_href", "is_active", "updated_at")
VALUES
(0, 'Starting at $274.00', 'The best tablet Collection 2023', 'Exclusive offer ', '-35% off', ' this week', 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=900&q=80', 'Tablet on a clean background', '/shop', true, CURRENT_TIMESTAMP),
(1, 'From $89.00', 'Smart watches for every lifestyle', 'Limited time ', '-25% off', ' smart wearables', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=900&q=80', 'Smartwatches', '/shop', true, CURRENT_TIMESTAMP),
(2, 'Deals under $150', 'Premium audio & accessories', 'Save up to ', '40%', ' on headphones', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=900&q=80', 'Headphones', '/shop', true, CURRENT_TIMESTAMP);
