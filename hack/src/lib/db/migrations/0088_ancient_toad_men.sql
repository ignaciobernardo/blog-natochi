ALTER TABLE "events" ADD COLUMN "slug" text;--> statement-breakpoint
UPDATE "events"
SET "slug" = COALESCE(
  NULLIF((regexp_match(lower("name"), 'hack[[:space:]-]*([0-9]{1,4})'))[1], ''),
  NULLIF(trim(both '-' from regexp_replace(lower("name"), '[^a-z0-9]+', '-', 'g')), ''),
  substring("id"::text, 1, 8)
)
WHERE "slug" IS NULL;--> statement-breakpoint
WITH dedup AS (
  SELECT
    "id",
    "slug",
    row_number() OVER (PARTITION BY "slug" ORDER BY "created_at", "id") AS "rn"
  FROM "events"
)
UPDATE "events" AS "e"
SET "slug" = CASE
  WHEN "d"."rn" = 1 THEN "d"."slug"
  ELSE "d"."slug" || '-' || "d"."rn"::text
END
FROM dedup AS "d"
WHERE "e"."id" = "d"."id" AND "d"."rn" > 1;--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "slug" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_slug_unique" UNIQUE("slug");
