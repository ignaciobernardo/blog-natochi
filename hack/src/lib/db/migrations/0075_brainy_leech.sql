ALTER TYPE "user_type" ADD VALUE 'voter';--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public_votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"project_id" uuid NOT NULL,
	"voted_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "public_votes_user_id_project_id_unique" UNIQUE("user_id","project_id")
);
--> statement-breakpoint
ALTER TABLE "projects" RENAME COLUMN "title" TO "name";--> statement-breakpoint
ALTER TABLE "projects" RENAME COLUMN "demo_url" TO "video_url";--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "slug" text NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "logo_url" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "source_has_slides" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "source_has_demo" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "slides_url" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "slides_map" json;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "public_votes" ADD CONSTRAINT "public_votes_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "public_votes" ADD CONSTRAINT "public_votes_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "public_votes_user_id_idx" ON "public_votes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "public_votes_project_id_idx" ON "public_votes" USING btree ("project_id");--> statement-breakpoint
ALTER TABLE "projects" DROP COLUMN IF EXISTS "track";--> statement-breakpoint
ALTER TABLE "projects" DROP COLUMN IF EXISTS "submitted_at";--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_slug_unique" UNIQUE("slug");