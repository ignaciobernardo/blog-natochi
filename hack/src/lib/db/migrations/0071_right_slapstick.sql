ALTER TABLE "events" ADD COLUMN "track_selection_start_time" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "track_team_limit" integer;--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "track_selector_id" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "teams" ADD CONSTRAINT "teams_track_selector_id_hackers_id_fk" FOREIGN KEY ("track_selector_id") REFERENCES "public"."hackers"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
