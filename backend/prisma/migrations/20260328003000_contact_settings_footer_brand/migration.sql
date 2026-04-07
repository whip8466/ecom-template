-- Footer brand block + Instagram / Pinterest (same singleton as contact page)
ALTER TABLE "contact_settings" ADD COLUMN "brand_name" VARCHAR(120) NOT NULL DEFAULT 'Dhidi';
ALTER TABLE "contact_settings" ADD COLUMN "footer_tagline" TEXT NOT NULL DEFAULT 'Curated fashion, beauty, and home decor for modern living. Quality you can trust, style that lasts.';
ALTER TABLE "contact_settings" ADD COLUMN "instagram_url" VARCHAR(500);
ALTER TABLE "contact_settings" ADD COLUMN "pinterest_url" VARCHAR(500);
