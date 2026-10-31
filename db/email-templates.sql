-- ---------------------------------------------------------------------------
-- Language Help BD — Automated email templates
-- Run once against the app database (Neon → SQL Editor, or psql -f).
-- Safe to run more than once.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "email_templates" (
  "id"         serial PRIMARY KEY NOT NULL,
  "key"        text NOT NULL,
  "subject"    text DEFAULT '' NOT NULL,
  "body_html"  text DEFAULT '' NOT NULL,
  "enabled"    boolean DEFAULT true NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "email_templates_key_unique" UNIQUE("key")
);
