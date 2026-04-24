ALTER TABLE "spotify_follower_accounts" ADD COLUMN "access_token" text;--> statement-breakpoint
ALTER TABLE "spotify_follower_accounts" ADD COLUMN "token_expires_at" timestamp with time zone;