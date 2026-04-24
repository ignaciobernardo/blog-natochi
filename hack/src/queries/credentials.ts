import { and, eq, inArray, or } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import {
  events,
  hackerProfiles,
  hackers,
  submissions,
} from '@/src/lib/db/schema';
import { getDefaultEvent } from './events';

export interface CredentialHacker {
  id: string;
  fullName: string;
  github: string | null;
}

export async function getHackersForCredentials(): Promise<CredentialHacker[]> {
  const defaultEvent = await getDefaultEvent();
  if (!defaultEvent) {
    return [];
  }

  const specificSubmissionIds = [
    'a52e8206-4581-410c-a9b4-75baf1927139',
    '07e65acf-73a9-4085-b4a7-fdafa516684f',
    '059f01b4-e987-4f99-ae6d-7815692d2d5d',
  ];

  const hackersData = await db
    .selectDistinct({
      id: hackers.id,
      fullName: hackers.fullName,
      github: hackers.github,
    })
    .from(hackers)
    .innerJoin(hackerProfiles, eq(hackerProfiles.hackerId, hackers.id))
    .innerJoin(submissions, eq(hackerProfiles.submissionId, submissions.id))
    .where(
      and(
        eq(submissions.eventId, defaultEvent.id),
        or(
          inArray(submissions.status, [
            'onboarding_request',
            'onboarding_complete',
          ]),
          inArray(submissions.id, specificSubmissionIds),
        ),
      ),
    )
    .orderBy(hackers.fullName);

  return hackersData;
}

export async function getSpotifyRefreshToken(
  eventId: string,
): Promise<string | null> {
  const [event] = await db
    .select({ spotifyRefreshToken: events.spotifyRefreshToken })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  return event?.spotifyRefreshToken || null;
}

export async function updateSpotifyRefreshToken(
  eventId: string,
  refreshToken: string,
): Promise<void> {
  await db
    .update(events)
    .set({ spotifyRefreshToken: refreshToken })
    .where(eq(events.id, eventId));
}

export async function hasSpotifyConnected(eventId: string): Promise<boolean> {
  const token = await getSpotifyRefreshToken(eventId);
  return token !== null;
}

export interface SpotifyTokenCache {
  accessToken: string | null;
  expiresAt: Date | null;
}

export async function getSpotifyTokenCache(
  eventId: string,
): Promise<SpotifyTokenCache> {
  const [event] = await db
    .select({
      accessToken: events.spotifyAccessToken,
      expiresAt: events.spotifyTokenExpiresAt,
    })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  return {
    accessToken: event?.accessToken || null,
    expiresAt: event?.expiresAt || null,
  };
}

export async function updateSpotifyTokenCache(
  eventId: string,
  accessToken: string,
  expiresAt: Date,
): Promise<void> {
  await db
    .update(events)
    .set({
      spotifyAccessToken: accessToken,
      spotifyTokenExpiresAt: expiresAt,
    })
    .where(eq(events.id, eventId));
}
