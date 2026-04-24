DO $$ BEGIN
 CREATE TYPE "public"."arcade_release_diagnostic_status" AS ENUM('succeeded', 'failed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "arcade_release_diagnostics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_slug" text NOT NULL,
	"challenge_id" uuid,
	"game_id" uuid,
	"github_username" text NOT NULL,
	"repo_name" text NOT NULL,
	"tag" text NOT NULL,
	"status" "arcade_release_diagnostic_status" NOT NULL,
	"stage" text NOT NULL,
	"message" text NOT NULL,
	"details" json,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "arcade_release_diagnostics" ADD CONSTRAINT "arcade_release_diagnostics_challenge_id_arcade_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."arcade_challenges"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "arcade_release_diagnostics" ADD CONSTRAINT "arcade_release_diagnostics_game_id_arcade_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."arcade_games"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "arcade_release_diagnostics_challenge_id_idx" ON "arcade_release_diagnostics" USING btree ("challenge_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "arcade_release_diagnostics_game_id_idx" ON "arcade_release_diagnostics" USING btree ("game_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "arcade_release_diagnostics_created_at_idx" ON "arcade_release_diagnostics" USING btree ("created_at");--> statement-breakpoint
