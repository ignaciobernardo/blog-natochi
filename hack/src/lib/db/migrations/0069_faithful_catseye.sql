ALTER TABLE "teams" ADD COLUMN "slug" text NULL;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_slug_unique" UNIQUE("slug");