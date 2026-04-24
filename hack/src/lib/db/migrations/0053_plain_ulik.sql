ALTER TABLE "events" ADD COLUMN "spotify_access_token" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "spotify_token_expires_at" timestamp with time zone;