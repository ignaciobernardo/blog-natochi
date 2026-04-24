-- Custom SQL migration file, put you code below! --

-- Remove 'rsvp_confirmed' and 'rsvp_expired' from submission_status enum

-- Drop defaults first
ALTER TABLE "submissions" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "teams" ALTER COLUMN "status" DROP DEFAULT;

-- Rename old type
ALTER TYPE "submission_status" RENAME TO "submission_status_old";

-- Create new type without the removed values
CREATE TYPE "submission_status" AS ENUM(
  'received',
  'priority_waiting',
  'asking_self_finance_trip',
  'approved',
  'onboarding_request',
  'onboarding_expired',
  'onboarding_complete',
  'rejected',
  'waiting_list',
  'withdrawn',
  'archived'
);

-- Alter columns to use new type
ALTER TABLE "submissions" ALTER COLUMN "status" TYPE "submission_status" USING "status"::text::"submission_status";
ALTER TABLE "teams" ALTER COLUMN "status" TYPE "submission_status" USING "status"::text::"submission_status";

-- Re-add defaults
ALTER TABLE "submissions" ALTER COLUMN "status" SET DEFAULT 'received'::"submission_status";
ALTER TABLE "teams" ALTER COLUMN "status" SET DEFAULT 'received'::"submission_status";

-- Drop old type
DROP TYPE "submission_status_old";
