import { and, asc, desc, eq, isNotNull, sql } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import {
  hackerProfiles,
  hackers,
  type InsertTrack,
  mentors,
  teams,
  tracks,
} from '@/src/lib/db/schema';
import type { TeamWithMembers } from './teams';

export async function getAllTracks(eventId: string) {
  return db
    .select()
    .from(tracks)
    .where(eq(tracks.eventId, eventId))
    .orderBy(desc(tracks.createdAt));
}

export async function getTrackById(id: string, eventId?: string) {
  const [track] = await db
    .select()
    .from(tracks)
    .where(
      eventId
        ? and(eq(tracks.id, id), eq(tracks.eventId, eventId))
        : eq(tracks.id, id),
    )
    .limit(1);
  return track;
}

export async function createTrack(data: Omit<InsertTrack, 'id'>) {
  const [track] = await db.insert(tracks).values(data).returning();
  return track;
}

export async function updateTrack(
  id: string,
  eventId: string,
  data: Partial<Omit<InsertTrack, 'id'>>,
) {
  const [track] = await db
    .update(tracks)
    .set(data)
    .where(and(eq(tracks.id, id), eq(tracks.eventId, eventId)))
    .returning();
  return track;
}

export async function deleteTrack(id: string, eventId: string) {
  await db
    .delete(tracks)
    .where(and(eq(tracks.id, id), eq(tracks.eventId, eventId)));
}

export async function getTeamsByTrackId(
  trackId: string,
  eventId?: string,
): Promise<TeamWithMembers[]> {
  const teamsData = await db
    .select({
      id: teams.id,
      eventId: teams.eventId,
      trackId: teams.trackId,
      trackSelectorId: teams.trackSelectorId,
      mentorId: teams.mentorId,
      slug: teams.slug,
      formedOnSite: teams.formedOnSite,
      tableNumber: teams.tableNumber,
      createdAt: teams.createdAt,
      updatedAt: teams.updatedAt,
      trackName: tracks.name,
      mentorFullName: mentors.fullName,
      mentorGithub: mentors.github,
    })
    .from(teams)
    .leftJoin(tracks, eq(teams.trackId, tracks.id))
    .leftJoin(mentors, eq(teams.mentorId, mentors.id))
    .where(
      eventId
        ? and(eq(teams.trackId, trackId), eq(teams.eventId, eventId))
        : eq(teams.trackId, trackId),
    )
    .orderBy(desc(teams.createdAt));

  const teamsWithMembers: TeamWithMembers[] = await Promise.all(
    teamsData.map(async (team) => {
      const members = await db
        .select({
          id: hackerProfiles.id,
          hackerId: hackers.id,
          fullName: hackers.fullName,
          github: hackers.github,
          email: hackers.email,
        })
        .from(hackerProfiles)
        .innerJoin(hackers, eq(hackerProfiles.hackerId, hackers.id))
        .where(eq(hackerProfiles.teamId, team.id));

      return {
        id: team.id,
        eventId: team.eventId,
        trackId: team.trackId,
        trackSelectorId: team.trackSelectorId,
        mentorId: team.mentorId,
        slug: team.slug,
        formedOnSite: team.formedOnSite,
        tableNumber: team.tableNumber,
        createdAt: team.createdAt,
        updatedAt: team.updatedAt,
        track:
          team.trackName && team.trackId
            ? {
                id: team.trackId,
                name: team.trackName,
              }
            : null,
        mentor:
          team.mentorFullName && team.mentorGithub && team.mentorId
            ? {
                id: team.mentorId,
                fullName: team.mentorFullName,
                github: team.mentorGithub,
              }
            : null,
        members,
      };
    }),
  );

  return teamsWithMembers;
}

export interface TrackWithTeams {
  id: string;
  name: string;
  description: string | null;
  teams: Array<{
    id: string;
    slug: string;
    members: Array<{
      id: string;
      github: string | null;
    }>;
  }>;
}

export async function checkAllTeamsSelectedTrack(
  eventId: string,
): Promise<boolean> {
  const [totalTeams] = await db
    .select({
      count: sql<number>`cast(count(*) as int)`,
    })
    .from(teams)
    .where(eq(teams.eventId, eventId));

  const [teamsWithTrack] = await db
    .select({
      count: sql<number>`cast(count(*) as int)`,
    })
    .from(teams)
    .where(and(eq(teams.eventId, eventId), isNotNull(teams.trackId)));

  const total = totalTeams?.count || 0;
  const withTrack = teamsWithTrack?.count || 0;

  return total > 0 && total === withTrack;
}

export async function getAllTracksWithTeams(
  eventId: string,
): Promise<TrackWithTeams[]> {
  const allTracks = await db
    .select()
    .from(tracks)
    .where(eq(tracks.eventId, eventId))
    .orderBy(asc(tracks.name));

  const tracksWithTeams: TrackWithTeams[] = await Promise.all(
    allTracks.map(async (track) => {
      const teamsData = await db
        .select({
          id: teams.id,
          slug: teams.slug,
        })
        .from(teams)
        .where(and(eq(teams.eventId, eventId), eq(teams.trackId, track.id)))
        .orderBy(asc(teams.slug));

      const teamsWithMembers = await Promise.all(
        teamsData.map(async (team) => {
          const members = await db
            .select({
              id: hackers.id,
              github: hackers.github,
            })
            .from(hackerProfiles)
            .innerJoin(hackers, eq(hackerProfiles.hackerId, hackers.id))
            .where(eq(hackerProfiles.teamId, team.id));

          return {
            id: team.id,
            slug: team.slug,
            members: members.map((m) => ({ id: m.id, github: m.github })),
          };
        }),
      );

      return {
        id: track.id,
        name: track.name,
        description: track.description,
        teams: teamsWithMembers,
      };
    }),
  );

  return tracksWithTeams.filter((track) => track.teams.length > 0);
}
