import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import {
  hackerProfiles,
  hackers,
  type InsertMusicActionLog,
  type InsertNowPlaying,
  musicActionLogs,
  nowPlaying,
  trackHistory,
} from '@/src/lib/db/schema';

// Now Playing Queries
export async function getCurrentTrack(eventId: string) {
  const [current] = await db
    .select({
      id: nowPlaying.id,
      trackName: nowPlaying.trackName,
      trackArtists: nowPlaying.trackArtists,
      trackUrl: nowPlaying.trackUrl,
      albumArt: nowPlaying.albumArt,
      addedByDiscordUsername: nowPlaying.addedByDiscordUsername,
      addedByDiscordId: nowPlaying.addedByDiscordId,
      addedByHackerName: hackers.fullName,
      addedByHackerGithub: hackers.github,
      currentVoteScore: nowPlaying.currentVoteScore,
      discordChannelId: nowPlaying.discordChannelId,
      discordMessageId: nowPlaying.discordMessageId,
      playingAt: nowPlaying.playingAt,
    })
    .from(nowPlaying)
    .leftJoin(hackers, eq(nowPlaying.addedByHackerId, hackers.id))
    .where(eq(nowPlaying.eventId, eventId))
    .orderBy(desc(nowPlaying.playingAt))
    .limit(1);

  return current || null;
}

export async function upsertNowPlaying(data: InsertNowPlaying) {
  // First, archive current track to history
  const [current] = await db
    .select()
    .from(nowPlaying)
    .where(eq(nowPlaying.eventId, data.eventId))
    .limit(1);

  if (current) {
    // Archive to history
    await db.insert(trackHistory).values({
      eventId: current.eventId,
      trackName: current.trackName,
      trackArtists: current.trackArtists,
      trackUrl: current.trackUrl,
      albumArt: current.albumArt,
      addedByDiscordUsername: current.addedByDiscordUsername,
      addedByDiscordId: current.addedByDiscordId,
      addedByHackerId: current.addedByHackerId,
      finalVoteScore: current.currentVoteScore,
      wasSkipped: current.currentVoteScore <= -7, // SKIP_THRESHOLD
      playedAt: current.playingAt,
    });

    // Delete old now_playing
    await db.delete(nowPlaying).where(eq(nowPlaying.eventId, data.eventId));
  }

  // Insert new track
  const [newTrack] = await db.insert(nowPlaying).values(data).returning();
  return newTrack;
}

export async function updateCurrentVoteScore(eventId: string, score: number) {
  await db
    .update(nowPlaying)
    .set({
      currentVoteScore: score,
      updatedAt: new Date(),
    })
    .where(eq(nowPlaying.eventId, eventId));
}

export async function updateDiscordMessage(
  eventId: string,
  channelId: string,
  messageId: string,
) {
  await db
    .update(nowPlaying)
    .set({
      discordChannelId: channelId,
      discordMessageId: messageId,
      updatedAt: new Date(),
    })
    .where(eq(nowPlaying.eventId, eventId));
}

export async function findHackerByDiscordUsername(discordUsername: string) {
  const [hacker] = await db
    .select({
      hackerId: hackers.id,
      fullName: hackers.fullName,
      discordId: hackerProfiles.discordId,
    })
    .from(hackerProfiles)
    .innerJoin(hackers, eq(hackerProfiles.hackerId, hackers.id))
    .where(eq(hackerProfiles.discordUsername, discordUsername))
    .limit(1);

  return hacker || null;
}

// Track History Queries
export async function getTrackHistory(eventId: string, limit = 20) {
  return db
    .select({
      id: trackHistory.id,
      trackName: trackHistory.trackName,
      trackArtists: trackHistory.trackArtists,
      trackUrl: trackHistory.trackUrl,
      albumArt: trackHistory.albumArt,
      addedByDiscordUsername: trackHistory.addedByDiscordUsername,
      addedByHackerName: hackers.fullName,
      addedByHackerGithub: hackers.github,
      finalVoteScore: trackHistory.finalVoteScore,
      wasSkipped: trackHistory.wasSkipped,
      playedAt: trackHistory.playedAt,
    })
    .from(trackHistory)
    .leftJoin(hackers, eq(trackHistory.addedByHackerId, hackers.id))
    .where(eq(trackHistory.eventId, eventId))
    .orderBy(desc(trackHistory.playedAt))
    .limit(limit);
}

// Music Action Logging
export async function trackMusicAction(data: InsertMusicActionLog) {
  await db.insert(musicActionLogs).values(data);
}

export async function checkRateLimit(
  userId: string,
  songsLimit = 2,
  timeWindowMinutes = 10,
) {
  const timeWindow = new Date(Date.now() - timeWindowMinutes * 60 * 1000);

  const recentActions = await db
    .select()
    .from(musicActionLogs)
    .where(
      and(
        eq(musicActionLogs.userId, userId),
        eq(musicActionLogs.action, 'ADD_SONG'),
        gte(musicActionLogs.timestamp, timeWindow),
      ),
    )
    .orderBy(musicActionLogs.timestamp);

  const count = recentActions.length;
  const remaining = Math.max(0, songsLimit - count);
  const isAllowed = remaining > 0;

  let resetTime = new Date();
  if (recentActions.length > 0) {
    const oldestAction = recentActions[0];
    resetTime = new Date(
      oldestAction.timestamp.getTime() + timeWindowMinutes * 60 * 1000,
    );
  }

  return {
    isAllowed,
    remaining,
    resetTime,
  };
}

// Find who added a track by searching recent ADD_SONG actions
export async function findUserWhoAddedTrack(trackName: string): Promise<{
  username: string;
  userId: string;
} | null> {
  const [action] = await db
    .select({
      username: musicActionLogs.username,
      userId: musicActionLogs.userId,
    })
    .from(musicActionLogs)
    .where(
      and(
        eq(musicActionLogs.action, 'ADD_SONG'),
        eq(musicActionLogs.trackName, trackName),
      ),
    )
    .orderBy(desc(musicActionLogs.timestamp))
    .limit(1);

  return action || null;
}

// Analytics Queries
export async function getTopContributors(eventId: string, limit = 10) {
  return db
    .select({
      hackerId: hackers.id,
      hackerName: hackers.fullName,
      github: hackers.github,
      discordUsername: trackHistory.addedByDiscordUsername,
      trackCount: sql<number>`count(*)`.as('track_count'),
    })
    .from(trackHistory)
    .innerJoin(hackers, eq(trackHistory.addedByHackerId, hackers.id))
    .where(eq(trackHistory.eventId, eventId))
    .groupBy(
      hackers.id,
      hackers.fullName,
      hackers.github,
      trackHistory.addedByDiscordUsername,
    )
    .orderBy(desc(sql`count(*)`))
    .limit(limit);
}

export async function getMusicStats(eventId: string) {
  const [stats] = await db
    .select({
      totalTracks: sql<number>`count(*)`.as('total_tracks'),
      totalSkipped:
        sql<number>`count(*) filter (where ${trackHistory.wasSkipped} = true)`.as(
          'total_skipped',
        ),
      avgVoteScore: sql<number>`avg(${trackHistory.finalVoteScore})`.as(
        'avg_vote_score',
      ),
    })
    .from(trackHistory)
    .where(eq(trackHistory.eventId, eventId));

  return stats;
}
