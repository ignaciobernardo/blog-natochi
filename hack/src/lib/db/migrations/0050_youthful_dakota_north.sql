CREATE TABLE IF NOT EXISTS "track_votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"now_playing_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"username" text NOT NULL,
	"vote_value" integer NOT NULL,
	"voted_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "track_votes_now_playing_id_user_id_unique" UNIQUE("now_playing_id","user_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "track_votes" ADD CONSTRAINT "track_votes_now_playing_id_now_playing_id_fk" FOREIGN KEY ("now_playing_id") REFERENCES "public"."now_playing"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "track_votes_user_id_idx" ON "track_votes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "track_votes_now_playing_id_idx" ON "track_votes" USING btree ("now_playing_id");