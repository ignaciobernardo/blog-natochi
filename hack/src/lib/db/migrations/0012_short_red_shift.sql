DO $$ BEGIN
 CREATE TYPE "public"."arcade_game_status" AS ENUM('draft', 'submitted');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TYPE "submission_source" ADD VALUE 'in-house';--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "arcade_games" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"github_username" text NOT NULL,
	"repo_name" text NOT NULL,
	"repo_url" text NOT NULL,
	"commit_sha" text,
	"status" "arcade_game_status" DEFAULT 'draft' NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"code" text NOT NULL,
	"code_minified" text NOT NULL,
	"submitted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "arcade_games_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "arcade_games" ADD CONSTRAINT "arcade_games_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
