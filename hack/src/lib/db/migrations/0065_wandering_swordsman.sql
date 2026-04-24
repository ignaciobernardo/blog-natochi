ALTER TABLE "person_entrances" ADD COLUMN "mentor_id" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "person_entrances" ADD CONSTRAINT "person_entrances_mentor_id_mentors_id_fk" FOREIGN KEY ("mentor_id") REFERENCES "public"."mentors"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "person_entrances_mentor_id_idx" ON "person_entrances" USING btree ("mentor_id");--> statement-breakpoint
ALTER TABLE "person_entrances" ADD CONSTRAINT "person_entrances_mentor_id_event_id_unique" UNIQUE("mentor_id","event_id");