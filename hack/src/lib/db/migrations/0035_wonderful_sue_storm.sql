ALTER TABLE "hacker_profiles" ADD COLUMN "discord_id" text;--> statement-breakpoint
ALTER TABLE "hacker_profiles" ADD COLUMN "discord_username" text;--> statement-breakpoint
ALTER TABLE "hacker_profiles" ADD COLUMN "discord_connected_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hacker_profiles_discord_id_idx" ON "hacker_profiles" USING btree ("discord_id");