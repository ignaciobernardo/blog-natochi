-- Custom SQL migration file, put you code below! --
CREATE TABLE IF NOT EXISTS "cronjobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_name" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"last_run" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cronjobs_job_name_unique" UNIQUE("job_name")
);
--> statement-breakpoint
ALTER TABLE "arcade_games" ALTER COLUMN "status" SET DEFAULT 'unsubmitted';--> statement-breakpoint
ALTER TABLE "arcade_games" ADD COLUMN "commit_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "arcade_games" ADD COLUMN "cover_base64" text;--> statement-breakpoint
-- Remove duplicates, keeping the most recent record for each (github_username, repo_name, event_id)
DELETE FROM "arcade_games"
WHERE "id" IN (
  SELECT "id"
  FROM (
    SELECT
      "id",
      ROW_NUMBER() OVER (
        PARTITION BY "github_username", "repo_name", "event_id"
        ORDER BY "updated_at" DESC, "created_at" DESC
      ) as rn
    FROM "arcade_games"
  ) t
  WHERE rn > 1
);--> statement-breakpoint
ALTER TABLE "arcade_games" ADD CONSTRAINT "arcade_games_github_username_repo_name_event_id_unique" UNIQUE("github_username","repo_name","event_id");