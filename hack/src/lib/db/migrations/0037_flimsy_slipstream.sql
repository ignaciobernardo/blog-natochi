ALTER TABLE "hacker_profiles" ADD COLUMN "anthropic_org_id" text;--> statement-breakpoint
ALTER TABLE "hacker_profiles" ADD COLUMN "anthropic_used_products" json;--> statement-breakpoint
ALTER TABLE "hacker_profiles" ADD COLUMN "anthropic_account_email" text;--> statement-breakpoint
ALTER TABLE "hacker_profiles" ADD COLUMN "anthropic_updates" boolean;--> statement-breakpoint
ALTER TABLE "hacker_profiles" ADD COLUMN "emergency_contact_name" text;--> statement-breakpoint
ALTER TABLE "hacker_profiles" ADD COLUMN "emergency_contact_phone" text;--> statement-breakpoint
ALTER TABLE "hacker_profiles" ADD COLUMN "onboard_complete_at" timestamp with time zone;