DO $$ BEGIN
 CREATE TYPE "public"."team_formation_status" AS ENUM('solo', 'formed', 'looking');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "hacker_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hacker_id" uuid NOT NULL,
	"submission_id" uuid NOT NULL,
	"age" integer,
	"bio" text,
	"education" text,
	"is_veteran" boolean DEFAULT false NOT NULL,
	"previous_hackathons" text,
	"shirt_size" text,
	"diet" text,
	"allergies" text,
	"physical_issues" text,
	"share_info_with_sponsors" boolean DEFAULT false NOT NULL,
	"country" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hacker_profiles_hacker_id_submission_id_unique" UNIQUE("hacker_id","submission_id")
);
--> statement-breakpoint
ALTER TABLE "hacker_notes" ADD COLUMN "author_admin_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "OutboundEmails" ADD COLUMN "submission_id" uuid;--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "formation_status" "team_formation_status" DEFAULT 'solo' NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "hacker_profiles" ADD CONSTRAINT "hacker_profiles_hacker_id_hackers_id_fk" FOREIGN KEY ("hacker_id") REFERENCES "public"."hackers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "hacker_profiles" ADD CONSTRAINT "hacker_profiles_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "hacker_notes" ADD CONSTRAINT "hacker_notes_author_admin_id_admins_id_fk" FOREIGN KEY ("author_admin_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "OutboundEmails" ADD CONSTRAINT "OutboundEmails_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
