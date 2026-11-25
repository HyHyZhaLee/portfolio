-- PF-028: the contact form gains a subject, and a message may be up to 10,000 characters with no minimum.
-- subject is NULL only for messages received before this migration; the API requires it from now on. Like name, email, and
-- message, it is a visitor's personal data, sent only to the owner and never logged (Non-Negotiable 9).
-- Widening a VARCHAR is a catalog-only change in PostgreSQL: no table rewrite.
ALTER TABLE contact_message ADD COLUMN subject VARCHAR(150);
ALTER TABLE contact_message ALTER COLUMN message TYPE VARCHAR(10000);
