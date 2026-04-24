-- Create player_mode enum
DO $$ BEGIN
 CREATE TYPE "public"."player_mode" AS ENUM('single_player', 'two_player');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create arcade_challenges table
CREATE TABLE IF NOT EXISTS "arcade_challenges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"submission_deadline" timestamp with time zone NOT NULL,
	"voting_deadline" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "arcade_challenges_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "arcade_challenges" ADD CONSTRAINT "arcade_challenges_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "arcade_challenges_event_id_idx" ON "arcade_challenges" USING btree ("event_id");
--> statement-breakpoint

-- Insert default challenge for hack-25 event
INSERT INTO "arcade_challenges" ("id", "event_id", "name", "slug", "description", "submission_deadline", "voting_deadline")
SELECT
  gen_random_uuid(),
  e."id",
  'Hack 25 Arcade',
  'hack-25-arcade',
  'Platanus Hack 25 Arcade Challenge',
  '2025-11-10T23:59:00-03:00'::timestamptz,
  '2025-11-17T23:59:00-03:00'::timestamptz
FROM "events" e
WHERE e."slug" = '25'
ON CONFLICT DO NOTHING;
--> statement-breakpoint

-- Create arcade_game_versions table
CREATE TABLE IF NOT EXISTS "arcade_game_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"version_number" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"code" text NOT NULL,
	"code_minified" text NOT NULL,
	"cover_url" text,
	"cover_hash" text,
	"commit_sha" text,
	"commit_date" timestamp with time zone,
	"player_mode" "player_mode" DEFAULT 'single_player' NOT NULL,
	"arcade_mapping" json,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "arcade_game_versions_slug_unique" UNIQUE("slug"),
	CONSTRAINT "arcade_game_versions_game_id_version_number_unique" UNIQUE("game_id","version_number")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "arcade_game_versions" ADD CONSTRAINT "arcade_game_versions_game_id_arcade_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."arcade_games"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "arcade_game_versions_game_id_idx" ON "arcade_game_versions" USING btree ("game_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "arcade_game_versions_game_id_version_idx" ON "arcade_game_versions" USING btree ("game_id","version_number");
--> statement-breakpoint

-- Create arcade_game_votes table
CREATE TABLE IF NOT EXISTS "arcade_game_votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"game_id" uuid NOT NULL,
	"voted_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "arcade_game_votes_user_id_game_id_unique" UNIQUE("user_id","game_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "arcade_game_votes" ADD CONSTRAINT "arcade_game_votes_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "arcade_game_votes" ADD CONSTRAINT "arcade_game_votes_game_id_arcade_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."arcade_games"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "arcade_game_votes_user_id_idx" ON "arcade_game_votes" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "arcade_game_votes_game_id_idx" ON "arcade_game_votes" USING btree ("game_id");
--> statement-breakpoint

-- Create arcade_game_plays table
CREATE TABLE IF NOT EXISTS "arcade_game_plays" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_id" uuid NOT NULL,
	"ip_address" text NOT NULL,
	"played_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "arcade_game_plays" ADD CONSTRAINT "arcade_game_plays_game_id_arcade_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."arcade_games"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "arcade_game_plays_game_id_idx" ON "arcade_game_plays" USING btree ("game_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "arcade_game_plays_game_ip_idx" ON "arcade_game_plays" USING btree ("game_id","ip_address");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "arcade_game_plays_played_at_idx" ON "arcade_game_plays" USING btree ("played_at");
--> statement-breakpoint

-- Add challenge_id to arcade_games (nullable first for migration)
ALTER TABLE "arcade_games" ADD COLUMN "challenge_id" uuid;
--> statement-breakpoint

-- Migrate existing arcade_games: set challenge_id from the hack-25 challenge
UPDATE "arcade_games"
SET "challenge_id" = (
  SELECT ac."id"
  FROM "arcade_challenges" ac
  WHERE ac."slug" = 'hack-25-arcade'
)
WHERE "challenge_id" IS NULL;
--> statement-breakpoint

-- Migrate existing arcade_games data into arcade_game_versions (v1)
INSERT INTO "arcade_game_versions" ("id", "game_id", "slug", "version_number", "title", "description", "code", "code_minified", "cover_url", "commit_sha", "commit_date", "arcade_mapping", "created_at", "updated_at")
SELECT
  gen_random_uuid(),
  ag."id",
  ag."slug",
  1,
  ag."title",
  ag."description",
  ag."code",
  ag."code_minified",
  ag."cover_url",
  ag."commit_sha",
  ag."commit_date",
  ag."arcade_mapping",
  ag."created_at",
  ag."updated_at"
FROM "arcade_games" ag
WHERE ag."title" IS NOT NULL;
--> statement-breakpoint

-- Now make challenge_id NOT NULL
ALTER TABLE "arcade_games" ALTER COLUMN "challenge_id" SET NOT NULL;
--> statement-breakpoint

-- Drop old constraints
ALTER TABLE "arcade_games" DROP CONSTRAINT IF EXISTS "arcade_games_slug_unique";
--> statement-breakpoint
ALTER TABLE "arcade_games" DROP CONSTRAINT IF EXISTS "arcade_games_github_username_repo_name_event_id_unique";
--> statement-breakpoint
ALTER TABLE "arcade_games" DROP CONSTRAINT IF EXISTS "arcade_games_event_id_events_id_fk";
--> statement-breakpoint

-- Drop old columns from arcade_games
ALTER TABLE "arcade_games" DROP COLUMN IF EXISTS "event_id";
--> statement-breakpoint
ALTER TABLE "arcade_games" DROP COLUMN IF EXISTS "slug";
--> statement-breakpoint
ALTER TABLE "arcade_games" DROP COLUMN IF EXISTS "commit_sha";
--> statement-breakpoint
ALTER TABLE "arcade_games" DROP COLUMN IF EXISTS "commit_date";
--> statement-breakpoint
ALTER TABLE "arcade_games" DROP COLUMN IF EXISTS "status";
--> statement-breakpoint
ALTER TABLE "arcade_games" DROP COLUMN IF EXISTS "title";
--> statement-breakpoint
ALTER TABLE "arcade_games" DROP COLUMN IF EXISTS "description";
--> statement-breakpoint
ALTER TABLE "arcade_games" DROP COLUMN IF EXISTS "code";
--> statement-breakpoint
ALTER TABLE "arcade_games" DROP COLUMN IF EXISTS "code_minified";
--> statement-breakpoint
ALTER TABLE "arcade_games" DROP COLUMN IF EXISTS "cover_url";
--> statement-breakpoint
ALTER TABLE "arcade_games" DROP COLUMN IF EXISTS "arcade_mapping";
--> statement-breakpoint
ALTER TABLE "arcade_games" DROP COLUMN IF EXISTS "submitted_at";
--> statement-breakpoint

-- Add new FK and constraints for arcade_games
DO $$ BEGIN
 ALTER TABLE "arcade_games" ADD CONSTRAINT "arcade_games_challenge_id_arcade_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."arcade_challenges"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "arcade_games_challenge_id_idx" ON "arcade_games" USING btree ("challenge_id");
--> statement-breakpoint
ALTER TABLE "arcade_games" ADD CONSTRAINT "arcade_games_github_username_repo_name_challenge_id_unique" UNIQUE("github_username","repo_name","challenge_id");
