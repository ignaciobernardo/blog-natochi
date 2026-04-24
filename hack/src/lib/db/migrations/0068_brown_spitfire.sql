CREATE TABLE IF NOT EXISTS "tracks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "teams" DROP CONSTRAINT "teams_public_status_token_unique";--> statement-breakpoint
ALTER TABLE "teams" DROP CONSTRAINT "teams_submission_id_submissions_id_fk";
--> statement-breakpoint
ALTER TABLE "hacker_profiles" ADD COLUMN "team_id" uuid;--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "track_id" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "hacker_profiles" ADD CONSTRAINT "hacker_profiles_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "teams" ADD CONSTRAINT "teams_track_id_tracks_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."tracks"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "teams" DROP COLUMN IF EXISTS "submission_id";--> statement-breakpoint
ALTER TABLE "teams" DROP COLUMN IF EXISTS "country";--> statement-breakpoint
ALTER TABLE "teams" DROP COLUMN IF EXISTS "status";--> statement-breakpoint
ALTER TABLE "teams" DROP COLUMN IF EXISTS "cohort";--> statement-breakpoint
ALTER TABLE "teams" DROP COLUMN IF EXISTS "roster_locked_at";--> statement-breakpoint
ALTER TABLE "teams" DROP COLUMN IF EXISTS "merged_from_team_ids";--> statement-breakpoint
ALTER TABLE "teams" DROP COLUMN IF EXISTS "public_status_token";