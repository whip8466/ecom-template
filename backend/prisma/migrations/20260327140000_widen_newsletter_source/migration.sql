-- Store pathname + query (current page) for newsletter signups; 50 chars was too short.
ALTER TABLE "newsletter_subscriptions" ALTER COLUMN "source" SET DATA TYPE VARCHAR(2048);
