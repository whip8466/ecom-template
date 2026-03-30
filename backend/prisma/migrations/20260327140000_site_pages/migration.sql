-- Editable storefront legal / marketing pages (About, Privacy, Terms)
CREATE TABLE "site_pages" (
    "id" SERIAL NOT NULL,
    "slug" VARCHAR(64) NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "body" TEXT NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "site_pages_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "site_pages_slug_key" ON "site_pages"("slug");

INSERT INTO "site_pages" ("slug", "title", "body", "updated_at")
VALUES
  ('about-us', 'About Us', '<p>Edit this page in Admin → Content → About Us.</p>', NOW()),
  ('privacy-policy', 'Privacy Policy', '<p>Edit this page in Admin → Content → Privacy Policy.</p>', NOW()),
  ('terms-of-service', 'Terms of Service', '<p>Edit this page in Admin → Content → Terms of Service.</p>', NOW());
