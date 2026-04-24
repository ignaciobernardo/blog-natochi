DO $$ BEGIN
 CREATE TYPE "public"."person_type" AS ENUM('hacker', 'mentor');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "person_entrances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"person_type" "person_type" NOT NULL,
	"hacker_id" uuid,
	"entered_at" timestamp with time zone DEFAULT now() NOT NULL,
	"registered_by_admin_id" uuid,
	CONSTRAINT "person_entrances_hacker_id_event_id_unique" UNIQUE("hacker_id","event_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "person_entrances" ADD CONSTRAINT "person_entrances_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "person_entrances" ADD CONSTRAINT "person_entrances_hacker_id_hackers_id_fk" FOREIGN KEY ("hacker_id") REFERENCES "public"."hackers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "person_entrances" ADD CONSTRAINT "person_entrances_registered_by_admin_id_admins_id_fk" FOREIGN KEY ("registered_by_admin_id") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "person_entrances_hacker_id_idx" ON "person_entrances" USING btree ("hacker_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "person_entrances_event_id_idx" ON "person_entrances" USING btree ("event_id");