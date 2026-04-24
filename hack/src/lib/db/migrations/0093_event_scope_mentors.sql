ALTER TABLE "mentors" ADD COLUMN "event_id" uuid;

UPDATE "mentors"
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
    FROM "mentors"
    WHERE "event_id" IS NULL
  ) THEN
    RAISE EXCEPTION 'Cannot backfill mentors.event_id without an existing event with slug 25';
  END IF;
END $$;

ALTER TABLE "mentors"
  ALTER COLUMN "event_id" SET NOT NULL;

ALTER TABLE "mentors"
  ADD CONSTRAINT "mentors_event_id_events_id_fk"
  FOREIGN KEY ("event_id")
  REFERENCES "public"."events"("id")
  ON DELETE cascade
  ON UPDATE no action;

CREATE INDEX "mentors_event_id_idx"
  ON "mentors" USING btree ("event_id");
