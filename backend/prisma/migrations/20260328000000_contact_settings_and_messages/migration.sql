-- Contact page singleton + inbound messages
CREATE TABLE "contact_settings" (
    "id" INTEGER NOT NULL PRIMARY KEY DEFAULT 1,
    "headline" VARCHAR(200) NOT NULL DEFAULT 'Keep In Touch with Us',
    "primary_email" VARCHAR(320) NOT NULL,
    "support_email" VARCHAR(320) NOT NULL,
    "phone" VARCHAR(80) NOT NULL,
    "address_line" VARCHAR(500) NOT NULL,
    "map_embed_url" TEXT,
    "facebook_url" VARCHAR(500),
    "twitter_url" VARCHAR(500),
    "linkedin_url" VARCHAR(500),
    "updated_at" TIMESTAMPTZ(6) NOT NULL
);

CREATE TABLE "contact_messages" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "subject" VARCHAR(500) NOT NULL,
    "body" TEXT NOT NULL,
    "save_info" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_messages_pkey" PRIMARY KEY ("id")
);

INSERT INTO "contact_settings" (
    "id",
    "headline",
    "primary_email",
    "support_email",
    "phone",
    "address_line",
    "map_embed_url",
    "facebook_url",
    "twitter_url",
    "linkedin_url",
    "updated_at"
) VALUES (
    1,
    'Keep In Touch with Us',
    'contact@lumina.com',
    'support@lumina.com',
    '+1 (402) 763 282 46',
    '84 Sleepy Hollow St, Jamaica, New York 1432',
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d193595.15830869428!2d-74.11976397304903!3d40.69766374874431!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c24fa5d33f083b%3A0xc80b8f06e177fe62!2sNew%20York%2C%20NY%2C%20USA!5e0!3m2!1sen!2sus!4v1710000000000!5m2!1sen!2sus',
    'https://facebook.com',
    'https://twitter.com',
    'https://linkedin.com',
    CURRENT_TIMESTAMP
);
