import { asc, desc, eq, or, sql } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import { type Event, events, type InsertEvent } from '@/src/lib/db/schema';

export async function getAllEvents(): Promise<Event[]> {
  return db.select().from(events).orderBy(desc(events.createdAt));
}

export async function getDefaultEvent(): Promise<Event | null> {
  const allEvents = await db
    .select({
      id: events.id,
      name: events.name,
      slug: events.slug,
      domain: events.domain,
      photosAlbumUrl: events.photosAlbumUrl,
      priorityAnswerDate: events.priorityAnswerDate,
      priorityDeadlineAt: events.priorityDeadlineAt,
      finalDeadlineAt: events.finalDeadlineAt,
      startsAt: events.startsAt,
      endsAt: events.endsAt,
      rsvpOpenAt: events.rsvpOpenAt,
      votingStartsAt: events.votingStartsAt,
      votingEndsAt: events.votingEndsAt,
      trackSelectionStartTime: events.trackSelectionStartTime,
      mentorSelectionStartTime: events.mentorSelectionStartTime,
      feedbackPrizeDeadline: events.feedbackPrizeDeadline,
      capacityTeams: events.capacityTeams,
      capacityHackers: events.capacityHackers,
      targetSubmission: events.targetSubmission,
      trackTeamLimit: events.trackTeamLimit,
      mentorTeamLimit: events.mentorTeamLimit,
      spotifyRefreshToken: events.spotifyRefreshToken,
      spotifyAccessToken: events.spotifyAccessToken,
      spotifyTokenExpiresAt: events.spotifyTokenExpiresAt,
      createdAt: events.createdAt,
      updatedAt: events.updatedAt,
      distance: sql<number>`LEAST(
        ABS(EXTRACT(EPOCH FROM (${events.finalDeadlineAt} - NOW()))),
        ABS(EXTRACT(EPOCH FROM (${events.priorityDeadlineAt} - NOW())))
      )`.as('distance'),
    })
    .from(events)
    .where(
      or(
        sql`${events.finalDeadlineAt} IS NOT NULL`,
        sql`${events.priorityDeadlineAt} IS NOT NULL`,
      ),
    )
    .orderBy(asc(sql`distance`))
    .limit(1);

  if (allEvents.length === 0) {
    return null;
  }

  const { distance: _distance, ...event } = allEvents[0];
  return event as Event;
}

export async function getEventById(id: string): Promise<Event | null> {
  const [event] = await db.select().from(events).where(eq(events.id, id));
  return event || null;
}

export async function getEventBySlug(slug: string): Promise<Event | null> {
  const [event] = await db.select().from(events).where(eq(events.slug, slug));
  return event || null;
}

export async function createEvent(data: InsertEvent): Promise<Event> {
  const [event] = await db.insert(events).values(data).returning();
  return event;
}

export async function updateEvent(
  id: string,
  data: Partial<InsertEvent>,
): Promise<Event> {
  const [event] = await db
    .update(events)
    .set(data)
    .where(eq(events.id, id))
    .returning();
  return event;
}

export async function deleteEvent(id: string): Promise<void> {
  await db.delete(events).where(eq(events.id, id));
}

export function isEventHappening(event: Event): boolean {
  if (!event.startsAt || !event.endsAt) {
    return false;
  }
  const now = new Date();
  return now >= event.startsAt && now <= event.endsAt;
}

export function isVotingPeriod(event: Event): boolean {
  if (!event.votingStartsAt) {
    return false;
  }
  const now = new Date();
  return now >= event.votingStartsAt;
}
