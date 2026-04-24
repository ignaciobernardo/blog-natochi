ALTER TABLE "hackers" DROP CONSTRAINT "hackers_event_id_events_id_fk";
--> statement-breakpoint
ALTER TABLE "hackers" DROP COLUMN IF EXISTS "event_id";