-- Replace LinkedIn URL with YouTube URL (column rename preserves existing data)
ALTER TABLE "contact_settings" RENAME COLUMN "linkedin_url" TO "youtube_url";
