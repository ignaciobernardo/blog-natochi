import { desc, eq, or } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import { type Event, events } from '@/src/lib/db/schema';

export const HACK_26_BA_EVENT_NAME = 'Platanus Hack 26: Buenos Aires';
export const HACK_26_BA_EVENT_SLUG = '26-ar';

export async function getHack26BuenosAiresEvent(): Promise<Event | null> {
  const [event] = await db
    .select()
    .from(events)
    .where(
      or(
        eq(events.name, HACK_26_BA_EVENT_NAME),
        eq(events.slug, HACK_26_BA_EVENT_SLUG),
      ),
    )
    .orderBy(desc(events.createdAt))
    .limit(1);

  return event || null;
}
