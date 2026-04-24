ALTER TABLE "tracks" ADD COLUMN "event_id" uuid;

UPDATE "tracks"
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
    FROM "tracks"
    WHERE "event_id" IS NULL
  ) THEN
    RAISE EXCEPTION 'Cannot backfill tracks.event_id without an existing event with slug 25';
  END IF;
END $$;

ALTER TABLE "tracks"
  ALTER COLUMN "event_id" SET NOT NULL;

ALTER TABLE "tracks"
  ADD CONSTRAINT "tracks_event_id_events_id_fk"
  FOREIGN KEY ("event_id")
  REFERENCES "public"."events"("id")
  ON DELETE cascade
  ON UPDATE no action;

CREATE INDEX "tracks_event_id_idx"
  ON "tracks" USING btree ("event_id");
