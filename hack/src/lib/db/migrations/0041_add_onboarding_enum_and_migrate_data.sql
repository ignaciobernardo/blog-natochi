-- Custom SQL migration file, put you code below! --

-- Add new enum values for onboarding flow
BEGIN;
ALTER TYPE "submission_status" ADD VALUE IF NOT EXISTS 'onboarding_request';
COMMIT;
--> statement-breakpoint

BEGIN;
ALTER TYPE "submission_status" ADD VALUE IF NOT EXISTS 'onboarding_expired';
COMMIT;
--> statement-breakpoint

BEGIN;
ALTER TYPE "submission_status" ADD VALUE IF NOT EXISTS 'onboarding_complete';
COMMIT;
--> statement-breakpoint

-- Map rsvp_confirmed to onboarding_request
UPDATE submissions
SET status = 'onboarding_request'
WHERE status = 'rsvp_confirmed';
--> statement-breakpoint

-- Map rsvp_expired to onboarding_expired
UPDATE submissions
SET status = 'onboarding_expired'
WHERE status = 'rsvp_expired';
--> statement-breakpoint

-- Also update teams table if needed
UPDATE teams
SET status = 'onboarding_request'
WHERE status = 'rsvp_confirmed';
--> statement-breakpoint

UPDATE teams
SET status = 'onboarding_expired'
WHERE status = 'rsvp_expired';