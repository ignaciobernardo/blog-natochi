import { and, eq } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import { events, timeSlots } from '@/src/lib/db/schema';

const HACK_25_SLUG = '25';
const HACK_26_AR_SLUG = '26-ar';

const HACK_25_START_ISO = '2025-11-21T18:30:00-03:00';
const HACK_26_AR_START_ISO = '2026-05-08T18:30:00-03:00';

async function main() {
  const [source] = await db
    .select()
    .from(events)
    .where(eq(events.slug, HACK_25_SLUG));
  const [target] = await db
    .select()
    .from(events)
    .where(eq(events.slug, HACK_26_AR_SLUG));

  if (!source) throw new Error(`Event with slug ${HACK_25_SLUG} not found`);
  if (!target) throw new Error(`Event with slug ${HACK_26_AR_SLUG} not found`);

  const offsetMs =
    new Date(HACK_26_AR_START_ISO).getTime() -
    new Date(HACK_25_START_ISO).getTime();

  const sourceSlots = await db
    .select()
    .from(timeSlots)
    .where(eq(timeSlots.eventId, source.id))
    .orderBy(timeSlots.startTime);

  console.log(
    `Found ${sourceSlots.length} source slots. Offset ${offsetMs / (1000 * 60 * 60 * 24)} days.`,
  );

  await db.delete(timeSlots).where(and(eq(timeSlots.eventId, target.id)));

  for (const slot of sourceSlots) {
    await db.insert(timeSlots).values({
      eventId: target.id,
      title: slot.title,
      description: slot.description,
      startTime: new Date(slot.startTime.getTime() + offsetMs),
      endTime: new Date(slot.endTime.getTime() + offsetMs),
      location: slot.location,
      color: slot.color,
      target: slot.target,
    });
  }

  console.log(`✅ Copied ${sourceSlots.length} time slots to ${target.name}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
