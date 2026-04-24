ALTER TYPE "submission_status" ADD VALUE 'archived';--> statement-breakpoint
ALTER TABLE "submissions" DROP COLUMN IF EXISTS "archived_at";