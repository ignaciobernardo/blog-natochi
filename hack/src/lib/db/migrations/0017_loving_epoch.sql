-- Create submission_modality enum type
CREATE TYPE "public"."submission_modality" AS ENUM('solo', 'team', 'team_looking');

-- Add modality column to submissions table with default
ALTER TABLE "public"."submissions" ADD COLUMN "modality" "public"."submission_modality" NOT NULL DEFAULT 'team';

-- Migrate data: Map formation_status from teams to submission modality
-- Join with teams to get the formation_status and map it to modality
UPDATE "public"."submissions" s
SET "modality" = CASE
  WHEN s."is_team" = false THEN 'solo'::"public"."submission_modality"
  WHEN s."is_team" = true AND t."formation_status" = 'solo' THEN 'solo'::"public"."submission_modality"
  WHEN s."is_team" = true AND t."formation_status" = 'looking' THEN 'team_looking'::"public"."submission_modality"
  WHEN s."is_team" = true AND t."formation_status" = 'formed' THEN 'team'::"public"."submission_modality"
  ELSE 'team'::"public"."submission_modality"
END
FROM "public"."teams" t
WHERE s."team_id" = t."id";

-- Remove the formation_status column from teams table
ALTER TABLE "public"."teams" DROP COLUMN IF EXISTS "formation_status";

-- Drop the enum type
DROP TYPE IF EXISTS "public"."team_formation_status" CASCADE;
