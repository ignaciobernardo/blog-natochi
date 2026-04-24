DO $$ BEGIN
 CREATE TYPE "public"."review_qualification" AS ENUM('hell_no', 'no', 'maybe', 'yes', 'hell_yes');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "qualification" "review_qualification" NOT NULL;--> statement-breakpoint
ALTER TABLE "reviews" DROP COLUMN IF EXISTS "notes";--> statement-breakpoint
ALTER TABLE "reviews" DROP COLUMN IF EXISTS "tags";