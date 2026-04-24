ALTER TABLE "OutboundEmails" DROP CONSTRAINT "OutboundEmails_submission_id_submissions_id_fk";
--> statement-breakpoint
ALTER TABLE "OutboundEmails" DROP COLUMN IF EXISTS "submission_id";