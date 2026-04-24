import { and, eq, ilike, inArray, isNotNull, or, sql } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import {
  hackerProfiles,
  hackers,
  mentors,
  personEntrances,
  submissions,
} from '@/src/lib/db/schema';

export interface PersonForEntrance {
  id: string;
  personType: 'hacker' | 'mentor';
  fullName: string;
  email: string | null;
  github: string | null;
  shoeSize: number | null;
  shirtSize: string | null;
  discordId: string | null;
  entranceId: string | null;
  enteredAt: Date | null;
}

interface SearchPeopleForEntranceParams {
  eventId: string;
  search: string;
  limit?: number;
}

export async function searchPeopleForEntrance({
  eventId,
  search,
  limit = 50,
}: SearchPeopleForEntranceParams): Promise<PersonForEntrance[]> {
  if (!search.trim()) return [];

  const searchTerm = `%${search.trim()}%`;

  // Search hackers
  const hackerResults = await db
    .select({
      id: hackers.id,
      personType: sql<'hacker'>`'hacker'`,
      fullName: hackers.fullName,
      email: hackers.email,
      github: hackers.github,
      shoeSize: hackerProfiles.shoeSize,
      shirtSize: hackerProfiles.shirtSize,
      discordId: hackerProfiles.discordId,
      entranceId: personEntrances.id,
      enteredAt: personEntrances.enteredAt,
    })
    .from(hackers)
    .innerJoin(hackerProfiles, eq(hackerProfiles.hackerId, hackers.id))
    .innerJoin(submissions, eq(hackerProfiles.submissionId, submissions.id))
    .leftJoin(
      personEntrances,
      and(
        eq(personEntrances.hackerId, hackers.id),
        eq(personEntrances.eventId, eventId),
      ),
    )
    .where(
      and(
        eq(submissions.eventId, eventId),
        inArray(submissions.status, [
          'onboarding_complete',
          'onboarding_request',
        ]),
        isNotNull(hackerProfiles.onboardCompleteAt),
        or(
          sql`unaccent(lower(${hackers.fullName})) ILIKE unaccent(lower(${searchTerm}))`,
          ilike(hackers.email, searchTerm),
        ),
      ),
    )
    .limit(limit);

  // Search mentors
  const mentorResults = await db
    .select({
      id: mentors.id,
      personType: sql<'mentor'>`'mentor'`,
      fullName: mentors.fullName,
      email: sql<string | null>`null`,
      github: mentors.github,
      shoeSize: sql<number | null>`null`,
      shirtSize: sql<string | null>`null`,
      discordId: sql<string | null>`null`,
      entranceId: personEntrances.id,
      enteredAt: personEntrances.enteredAt,
    })
    .from(mentors)
    .leftJoin(
      personEntrances,
      and(
        eq(personEntrances.mentorId, mentors.id),
        eq(personEntrances.eventId, eventId),
      ),
    )
    .where(
      and(
        eq(mentors.eventId, eventId),
        or(
          sql`unaccent(lower(${mentors.fullName})) ILIKE unaccent(lower(${searchTerm}))`,
          ilike(mentors.github, searchTerm),
        ),
      ),
    )
    .limit(limit);

  // Combine and sort by name
  const combined = [...hackerResults, ...mentorResults] as PersonForEntrance[];
  combined.sort((a, b) => a.fullName.localeCompare(b.fullName));

  return combined.slice(0, limit);
}

export async function markHackerEntrance({
  eventId,
  hackerId,
  adminId,
}: {
  eventId: string;
  hackerId: string;
  adminId: string;
}): Promise<{ id: string }> {
  const [entrance] = await db
    .insert(personEntrances)
    .values({
      eventId,
      hackerId,
      personType: 'hacker',
      registeredByAdminId: adminId,
    })
    .returning({ id: personEntrances.id });

  return entrance;
}

export async function markMentorEntrance({
  eventId,
  mentorId,
  adminId,
}: {
  eventId: string;
  mentorId: string;
  adminId: string;
}): Promise<{ id: string }> {
  const [entrance] = await db
    .insert(personEntrances)
    .values({
      eventId,
      mentorId,
      personType: 'mentor',
      registeredByAdminId: adminId,
    })
    .returning({ id: personEntrances.id });

  return entrance;
}

export async function getHackerEntranceInfo(hackerId: string) {
  const [result] = await db
    .select({
      fullName: hackers.fullName,
      github: hackers.github,
      discordId: hackerProfiles.discordId,
    })
    .from(hackers)
    .innerJoin(hackerProfiles, eq(hackerProfiles.hackerId, hackers.id))
    .where(eq(hackers.id, hackerId))
    .limit(1);

  return result;
}

export async function getMentorEntranceInfo(mentorId: string, eventId: string) {
  const [result] = await db
    .select({
      fullName: mentors.fullName,
      github: mentors.github,
    })
    .from(mentors)
    .where(and(eq(mentors.id, mentorId), eq(mentors.eventId, eventId)))
    .limit(1);

  return result;
}

export async function getEntranceStats(eventId: string) {
  // Get hacker stats
  const [hackerStats] = await db
    .select({
      total: sql<number>`count(DISTINCT ${hackers.id})::int`,
      entered: sql<number>`count(DISTINCT ${personEntrances.id})::int`,
    })
    .from(hackers)
    .innerJoin(hackerProfiles, eq(hackerProfiles.hackerId, hackers.id))
    .innerJoin(submissions, eq(hackerProfiles.submissionId, submissions.id))
    .leftJoin(
      personEntrances,
      and(
        eq(personEntrances.hackerId, hackers.id),
        eq(personEntrances.eventId, eventId),
      ),
    )
    .where(
      and(
        eq(submissions.eventId, eventId),
        inArray(submissions.status, [
          'onboarding_complete',
          'onboarding_request',
        ]),
        isNotNull(hackerProfiles.onboardCompleteAt),
      ),
    );

  // Get mentor stats
  const [mentorStats] = await db
    .select({
      total: sql<number>`count(DISTINCT ${mentors.id})::int`,
      entered: sql<number>`count(DISTINCT ${personEntrances.id})::int`,
    })
    .from(mentors)
    .leftJoin(
      personEntrances,
      and(
        eq(personEntrances.mentorId, mentors.id),
        eq(personEntrances.eventId, eventId),
      ),
    )
    .where(eq(mentors.eventId, eventId));

  const totalPeople = hackerStats.total + mentorStats.total;
  const totalEntered = hackerStats.entered + mentorStats.entered;

  return {
    totalHackers: hackerStats.total,
    totalMentors: mentorStats.total,
    totalPeople,
    totalEntered,
    percentage:
      totalPeople > 0 ? Math.round((totalEntered / totalPeople) * 100) : 0,
  };
}
