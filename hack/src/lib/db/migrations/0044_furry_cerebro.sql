-- Add role field to user table for admin plugin
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "role" text DEFAULT 'user';
