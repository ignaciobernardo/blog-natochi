-- Custom SQL migration file, put you code below! --

-- ================================================================
-- Phase 1: Add new columns
-- ================================================================

-- Add status, cohort, country to submissions (nullable for now)
ALTER TABLE "submissions" ADD COLUMN "status" "team_status";
ALTER TABLE "submissions" ADD COLUMN "cohort" "cohort";
ALTER TABLE "submissions" ADD COLUMN "country" text;

-- Add submissionId to teams (nullable)
ALTER TABLE "teams" ADD COLUMN "submission_id" uuid;

-- ================================================================
-- Phase 2: Migrate existing data
-- ================================================================

-- Copy status, cohort, country from teams to their submissions
UPDATE "submissions" s
SET
  "status" = t."status",
  "cohort" = t."cohort",
  "country" = t."country"
FROM "teams" t
WHERE s."team_id" = t."id";

-- Set submissionId on teams to point back to their submission
UPDATE "teams" t
SET "submission_id" = s."id"
FROM "submissions" s
WHERE s."team_id" = t."id";

-- ================================================================
-- Phase 3: Add constraints and defaults
-- ================================================================

-- Make new columns NOT NULL with defaults
ALTER TABLE "submissions" ALTER COLUMN "status" SET NOT NULL;
ALTER TABLE "submissions" ALTER COLUMN "status" SET DEFAULT 'received';
ALTER TABLE "submissions" ALTER COLUMN "cohort" SET NOT NULL;
ALTER TABLE "submissions" ALTER COLUMN "country" SET NOT NULL;

-- Make teamId nullable on submissions
ALTER TABLE "submissions" ALTER COLUMN "team_id" DROP NOT NULL;

-- Add FK constraint for teams.submission_id
ALTER TABLE "teams" ADD CONSTRAINT "teams_submission_id_submissions_id_fk"
  FOREIGN KEY ("submission_id") REFERENCES "submissions"("id") ON DELETE cascade;

-- ================================================================
-- Phase 4: Rename team_notes table and update FKs
-- ================================================================

-- First, add a temporary column to hold submission_id
ALTER TABLE "team_notes" ADD COLUMN "submission_id_temp" uuid;

-- Update team_notes to point to submissions instead of teams
UPDATE "team_notes" tn
SET "submission_id_temp" = s."id"
FROM "teams" t
JOIN "submissions" s ON s."team_id" = t."id"
WHERE tn."team_id" = t."id";

-- Make the temp column NOT NULL and add FK constraint
ALTER TABLE "team_notes" ALTER COLUMN "submission_id_temp" SET NOT NULL;
ALTER TABLE "team_notes" ADD CONSTRAINT "team_notes_submission_id_temp_submissions_id_fk"
  FOREIGN KEY ("submission_id_temp") REFERENCES "submissions"("id") ON DELETE cascade;

-- Drop the old team_id FK and column
ALTER TABLE "team_notes" DROP CONSTRAINT "team_notes_team_id_teams_id_fk";
ALTER TABLE "team_notes" DROP COLUMN "team_id";

-- Rename temp column to submission_id
ALTER TABLE "team_notes" RENAME COLUMN "submission_id_temp" TO "submission_id";

-- Rename the constraint to proper name
ALTER TABLE "team_notes" RENAME CONSTRAINT "team_notes_submission_id_temp_submissions_id_fk"
  TO "submission_notes_submission_id_submissions_id_fk";

-- Finally, rename the table
ALTER TABLE "team_notes" RENAME TO "submission_notes";

-- ================================================================
-- Phase 5: Update status_history FK
-- ================================================================

-- Add temporary column
ALTER TABLE "status_history" ADD COLUMN "submission_id_temp" uuid;

-- Update status_history to point to submissions instead of teams
UPDATE "status_history" sh
SET "submission_id_temp" = s."id"
FROM "teams" t
JOIN "submissions" s ON s."team_id" = t."id"
WHERE sh."team_id" = t."id";

-- Make temp column NOT NULL and add FK
ALTER TABLE "status_history" ALTER COLUMN "submission_id_temp" SET NOT NULL;
ALTER TABLE "status_history" ADD CONSTRAINT "status_history_submission_id_temp_submissions_id_fk"
  FOREIGN KEY ("submission_id_temp") REFERENCES "submissions"("id") ON DELETE cascade;

-- Drop old FK and column
ALTER TABLE "status_history" DROP CONSTRAINT "status_history_team_id_teams_id_fk";
ALTER TABLE "status_history" DROP COLUMN "team_id";

-- Rename temp column
ALTER TABLE "status_history" RENAME COLUMN "submission_id_temp" TO "submission_id";

-- Rename constraint
ALTER TABLE "status_history" RENAME CONSTRAINT "status_history_submission_id_temp_submissions_id_fk"
  TO "status_history_submission_id_submissions_id_fk";

-- ================================================================
-- Phase 6: Update reviews FK
-- ================================================================

-- Add temporary column
ALTER TABLE "reviews" ADD COLUMN "submission_id_temp" uuid;

-- Update reviews to point to submissions instead of teams
UPDATE "reviews" r
SET "submission_id_temp" = s."id"
FROM "teams" t
JOIN "submissions" s ON s."team_id" = t."id"
WHERE r."team_id" = t."id";

-- Make temp column NOT NULL and add FK
ALTER TABLE "reviews" ALTER COLUMN "submission_id_temp" SET NOT NULL;
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_submission_id_temp_submissions_id_fk"
  FOREIGN KEY ("submission_id_temp") REFERENCES "submissions"("id") ON DELETE cascade;

-- Drop old FK and column
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_team_id_teams_id_fk";
ALTER TABLE "reviews" DROP COLUMN "team_id";

-- Rename temp column
ALTER TABLE "reviews" RENAME COLUMN "submission_id_temp" TO "submission_id";

-- Rename constraint
ALTER TABLE "reviews" RENAME CONSTRAINT "reviews_submission_id_temp_submissions_id_fk"
  TO "reviews_submission_id_submissions_id_fk";
