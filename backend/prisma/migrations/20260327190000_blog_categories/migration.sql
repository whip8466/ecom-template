CREATE TABLE "blog_categories" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(200) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "blog_categories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "blog_categories_slug_key" ON "blog_categories"("slug");

ALTER TABLE "blog_posts" ADD COLUMN "blog_category_id" INTEGER;
CREATE INDEX "blog_posts_blog_category_id_idx" ON "blog_posts"("blog_category_id");
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_blog_category_id_fkey" FOREIGN KEY ("blog_category_id") REFERENCES "blog_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
