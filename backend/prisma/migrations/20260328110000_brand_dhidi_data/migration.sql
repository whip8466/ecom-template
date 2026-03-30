-- Rename legacy brand values to Dhidi (products fulfillment + contact emails)
UPDATE "products" SET "fulfillment_type" = 'dhidi' WHERE "fulfillment_type" = 'phoenix';

UPDATE "contact_settings" SET "primary_email" = 'contact@dhidi.com' WHERE "primary_email" = 'contact@lumina.com';
UPDATE "contact_settings" SET "support_email" = 'support@dhidi.com' WHERE "support_email" = 'support@lumina.com';
