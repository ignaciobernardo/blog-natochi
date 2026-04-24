ALTER TABLE "arcade_game_versions" ADD COLUMN IF NOT EXISTS "gameplay_preview_url" text;--> statement-breakpoint
ALTER TABLE "arcade_game_versions" ADD COLUMN IF NOT EXISTS "gameplay_poster_url" text;--> statement-breakpoint
ALTER TABLE "arcade_game_versions" ADD COLUMN IF NOT EXISTS "gameplay_preview_status" text DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "priority_answer_date" timestamp with time zone;
