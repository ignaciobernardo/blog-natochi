CREATE TABLE IF NOT EXISTS "spotify_follower_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"display_name" text NOT NULL,
	"refresh_token" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_synced_track_uri" text,
	"last_synced_at" timestamp with time zone,
	"last_sync_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "spotify_follower_accounts" ADD CONSTRAINT "spotify_follower_accounts_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "spotify_follower_accounts_event_id_idx" ON "spotify_follower_accounts" USING btree ("event_id");