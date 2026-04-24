ALTER TABLE "external_people" ADD COLUMN "event_id" uuid;

UPDATE "external_people"
SET "event_id" = (
  SELECT "id"
  FROM "events"
  WHERE "slug" = '25'
)
WHERE "event_id" IS NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "external_people"
    WHERE "event_id" IS NULL
  ) THEN
    RAISE EXCEPTION 'Cannot backfill external_people.event_id without an existing event with slug 25';
  END IF;
END $$;

ALTER TABLE "external_people"
  ALTER COLUMN "event_id" SET NOT NULL;

ALTER TABLE "external_people"
  ADD CONSTRAINT "external_people_event_id_events_id_fk"
  FOREIGN KEY ("event_id")
  REFERENCES "public"."events"("id")
  ON DELETE cascade
  ON UPDATE no action;

ALTER TABLE "external_people"
  DROP CONSTRAINT IF EXISTS "external_people_slug_unique";

CREATE INDEX "external_people_event_id_idx"
  ON "external_people" USING btree ("event_id");

ALTER TABLE "external_people"
  ADD CONSTRAINT "external_people_event_id_slug_unique"
  UNIQUE ("event_id", "slug");
