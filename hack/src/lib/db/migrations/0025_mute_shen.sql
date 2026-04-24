ALTER TYPE "submission_status" ADD VALUE 'priority_waiting';--> statement-breakpoint
ALTER TABLE "hackers" ADD COLUMN "public_id" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "hackers" ADD CONSTRAINT "hackers_public_id_unique" UNIQUE("public_id");