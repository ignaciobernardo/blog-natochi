DO $$ BEGIN
 CREATE TYPE "public"."music_action" AS ENUM('ADD_SONG', 'NOW_PLAYING_VIEW', 'QUEUE_VIEW');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "music_action_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"username" text NOT NULL,
	"action" "music_action" NOT NULL,
	"track_name" text,
	"track_artists" text,
	"track_url" text,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "now_playing" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"track_name" text NOT NULL,
	"track_artists" text NOT NULL,
	"track_url" text NOT NULL,
	"album_art" text,
	"added_by_discord_username" text,
	"added_by_hacker_id" uuid,
	"current_vote_score" integer DEFAULT 0 NOT NULL,
	"playing_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "track_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"track_name" text NOT NULL,
	"track_artists" text NOT NULL,
	"track_url" text NOT NULL,
	"album_art" text,
	"added_by_discord_username" text,
	"added_by_hacker_id" uuid,
	"final_vote_score" integer,
	"was_skipped" boolean DEFAULT false NOT NULL,
	"played_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "now_playing" ADD CONSTRAINT "now_playing_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "now_playing" ADD CONSTRAINT "now_playing_added_by_hacker_id_hackers_id_fk" FOREIGN KEY ("added_by_hacker_id") REFERENCES "public"."hackers"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "track_history" ADD CONSTRAINT "track_history_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "track_history" ADD CONSTRAINT "track_history_added_by_hacker_id_hackers_id_fk" FOREIGN KEY ("added_by_hacker_id") REFERENCES "public"."hackers"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "music_action_logs_user_id_idx" ON "music_action_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "music_action_logs_timestamp_idx" ON "music_action_logs" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "music_action_logs_action_idx" ON "music_action_logs" USING btree ("action");