-- Remove optional social feed embed HTML columns
ALTER TABLE "social_feed_settings" DROP COLUMN IF EXISTS "embed_instagram_html";
ALTER TABLE "social_feed_settings" DROP COLUMN IF EXISTS "embed_youtube_html";
ALTER TABLE "social_feed_settings" DROP COLUMN IF EXISTS "embed_facebook_html";
