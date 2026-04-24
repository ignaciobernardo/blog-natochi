import { and, desc, eq, ilike, inArray, sql } from 'drizzle-orm';
import { distance } from 'fastest-levenshtein';
import { db } from '@/src/lib/db';
import {
  type ExternalPerson,
  externalPeople,
  type Hacker,
  type HackerProfile,
  hackerProfiles,
  hackers,
  type Mentor,
  mentors,
  submissions,
} from '@/src/lib/db/schema';

export type PersonLookupResult =
  | { type: 'hacker'; data: Hacker; profile: HackerProfile | null }
  | { type: 'mentor'; data: Mentor }
  | { type: 'external'; data: ExternalPerson }
  | null;

const VALID_HACKER_STATUSES = [
  'onboarding_request',
  'onboarding_complete',
] as const;

function extractGithubUsername(slug: string): string {
  return slug.toLowerCase().replace(/^@/, '');
}

export async function findPersonBySlugForEvent(
  eventId: string,
  slug: string,
): Promise<PersonLookupResult> {
  const normalizedSlug = extractGithubUsername(slug);

  const hackerResults = await db
    .select({
      hacker: hackers,
      profile: hackerProfiles,
    })
    .from(hackers)
    .innerJoin(hackerProfiles, eq(hackerProfiles.hackerId, hackers.id))
    .innerJoin(submissions, eq(submissions.id, hackerProfiles.submissionId))
    .where(
      and(
        eq(submissions.eventId, eventId),
        ilike(hackers.github, `%/${normalizedSlug}`),
        inArray(submissions.status, [...VALID_HACKER_STATUSES]),
      ),
    )
    .limit(1);

  if (hackerResults.length > 0) {
    return {
      type: 'hacker',
      data: hackerResults[0].hacker,
      profile: hackerResults[0].profile,
    };
  }

  const mentorResults = await db
    .select()
    .from(mentors)
    .where(
      and(
        eq(mentors.eventId, eventId),
        ilike(mentors.github, `%/${normalizedSlug}`),
      ),
    )
    .orderBy(desc(mentors.createdAt))
    .limit(1);

  if (mentorResults.length > 0) {
    return { type: 'mentor', data: mentorResults[0] };
  }

  const externalResults = await db
    .select()
    .from(externalPeople)
    .where(
      and(
        eq(externalPeople.eventId, eventId),
        ilike(externalPeople.slug, normalizedSlug),
      ),
    )
    .orderBy(desc(externalPeople.createdAt))
    .limit(1);

  if (externalResults.length > 0) {
    return { type: 'external', data: externalResults[0] };
  }

  return fuzzySearchPersonForEvent(eventId, normalizedSlug);
}

async function fuzzySearchPersonForEvent(
  eventId: string,
  slug: string,
): Promise<PersonLookupResult> {
  const maxDistance = 2;

  const [allHackersWithProfiles, allMentors, allExternal] = await Promise.all([
    db
      .select({
        hacker: hackers,
        profile: hackerProfiles,
      })
      .from(hackers)
      .innerJoin(hackerProfiles, eq(hackerProfiles.hackerId, hackers.id))
      .innerJoin(submissions, eq(submissions.id, hackerProfiles.submissionId))
      .where(
        and(
          eq(submissions.eventId, eventId),
          sql`${hackers.github} IS NOT NULL`,
          inArray(submissions.status, [...VALID_HACKER_STATUSES]),
        ),
      ),
    db
      .select()
      .from(mentors)
      .where(eq(mentors.eventId, eventId))
      .orderBy(desc(mentors.createdAt)),
    db
      .select()
      .from(externalPeople)
      .where(eq(externalPeople.eventId, eventId))
      .orderBy(desc(externalPeople.createdAt)),
  ]);

  for (const { hacker, profile } of allHackersWithProfiles) {
    if (!hacker.github) continue;
    const githubUsername = hacker.github.split('/').pop()?.toLowerCase() ?? '';
    if (distance(slug, githubUsername) <= maxDistance) {
      return {
        type: 'hacker',
        data: hacker,
        profile,
      };
    }
  }

  for (const mentor of allMentors) {
    const githubUsername = mentor.github.split('/').pop()?.toLowerCase() ?? '';
    if (distance(slug, githubUsername) <= maxDistance) {
      return { type: 'mentor', data: mentor };
    }
  }

  for (const external of allExternal) {
    if (distance(slug, external.slug.toLowerCase()) <= maxDistance) {
      return { type: 'external', data: external };
    }
  }

  return null;
}
