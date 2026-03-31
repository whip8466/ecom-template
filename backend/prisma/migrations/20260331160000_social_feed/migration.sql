-- Social Feed: settings singleton, posts, SEO articles
CREATE TYPE "SocialFeedContentType" AS ENUM ('VIDEO', 'REEL', 'POST', 'TIPS', 'CUSTOMER_STORY');
CREATE TYPE "SocialFeedPlatform" AS ENUM ('YOUTUBE', 'INSTAGRAM', 'FACEBOOK');

CREATE TABLE "social_feed_settings" (
    "id" INTEGER NOT NULL PRIMARY KEY DEFAULT 1,
    "hero_title" VARCHAR(200) NOT NULL DEFAULT 'Our Journey',
    "hero_subtitle" TEXT NOT NULL,
    "hero_shop_cta_label" VARCHAR(120),
    "hero_shop_cta_url" VARCHAR(500),
    "hero_instagram_cta_label" VARCHAR(120),
    "hero_instagram_cta_url" VARCHAR(500),
    "cta_section_title" VARCHAR(200),
    "cta_shop_url" VARCHAR(500),
    "cta_follow_url" VARCHAR(500),
    "cta_community_url" VARCHAR(500),
    "embed_instagram_html" TEXT,
    "embed_youtube_html" TEXT,
    "embed_facebook_html" TEXT,
    "updated_at" TIMESTAMPTZ(6) NOT NULL
);

INSERT INTO "social_feed_settings" (
    "id",
    "hero_title",
    "hero_subtitle",
    "hero_shop_cta_label",
    "hero_shop_cta_url",
    "hero_instagram_cta_label",
    "hero_instagram_cta_url",
    "cta_section_title",
    "cta_shop_url",
    "cta_follow_url",
    "cta_community_url",
    "updated_at"
) VALUES (
    1,
    'Our Journey',
    'See how our handmade products are made, used, and loved by our community.',
    'Shop Now',
    '/shop',
    'Follow Us on Instagram',
    NULL,
    'Love what you see?',
    '/shop',
    NULL,
    NULL,
    CURRENT_TIMESTAMP
);

CREATE TABLE "social_feed_posts" (
    "id" SERIAL NOT NULL,
    "content_type" "SocialFeedContentType" NOT NULL,
    "platform" "SocialFeedPlatform" NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "description" TEXT NOT NULL,
    "thumbnail_url" VARCHAR(2000),
    "external_url" VARCHAR(2000) NOT NULL,
    "cta_label" VARCHAR(120),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "published_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "social_feed_posts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "social_feed_posts_content_type_is_published_idx" ON "social_feed_posts"("content_type", "is_published");
CREATE INDEX "social_feed_posts_is_featured_idx" ON "social_feed_posts"("is_featured");