-- Remove hero Shop / Instagram CTA fields from social feed settings
ALTER TABLE "social_feed_settings" DROP COLUMN IF EXISTS "hero_shop_cta_label";
ALTER TABLE "social_feed_settings" DROP COLUMN IF EXISTS "hero_shop_cta_url";
ALTER TABLE "social_feed_settings" DROP COLUMN IF EXISTS "hero_instagram_cta_label";
ALTER TABLE "social_feed_settings" DROP COLUMN IF EXISTS "hero_instagram_cta_url";
