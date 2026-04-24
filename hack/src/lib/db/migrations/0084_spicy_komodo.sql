DO $$ BEGIN
 CREATE TYPE "public"."feedback_usage_permission" AS ENUM('yes_with_name', 'yes_anonymous', 'no');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."funding_preference" AS ENUM('bootstrapped', 'vc', 'other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."participation_intent" AS ENUM('yes', 'no', 'maybe');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."sponsor_work_intent" AS ENUM('yes', 'no', 'already_did');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."startup_ambition" AS ENUM('up_to_100k', '100k_to_1m', '1m_to_10m', '10m_plus', 'not_sure');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."startup_intent" AS ENUM('yes', 'no', 'already_building');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "hacker_feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hacker_profile_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"overall_rating" integer NOT NULL,
	"nps_score" integer NOT NULL,
	"participation_intent" "participation_intent" NOT NULL,
	"event_quality_ratings" json NOT NULL,
	"best_part" text NOT NULL,
	"worst_part" text,
	"suggestions" text,
	"sponsor_unaided_recall" text NOT NULL,
	"sponsors_interacted" json,
	"sponsor_work_intent" "sponsor_work_intent",
	"sponsor_comments" text,
	"startup_intent" "startup_intent" NOT NULL,
	"funding_preference" "funding_preference",
	"startup_ambition" "startup_ambition",
	"how_heard_about" text,
	"additional_comments" text,
	"media_urls" json,
	"feedback_usage_permission" "feedback_usage_permission" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hacker_feedback_hacker_profile_id_event_id_unique" UNIQUE("hacker_profile_id","event_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "hacker_feedback" ADD CONSTRAINT "hacker_feedback_hacker_profile_id_hacker_profiles_id_fk" FOREIGN KEY ("hacker_profile_id") REFERENCES "public"."hacker_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "hacker_feedback" ADD CONSTRAINT "hacker_feedback_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hacker_feedback_hacker_profile_id_idx" ON "hacker_feedback" USING btree ("hacker_profile_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hacker_feedback_event_id_idx" ON "hacker_feedback" USING btree ("event_id");