import { and, asc, eq, ilike, isNotNull, or } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import {
  hackerProfiles,
  hackers,
  type InsertTeam,
  mentors,
  type Team,
  teams,
  tracks,
} from '@/src/lib/db/schema';

export interface TeamWithMembers extends Team {
  track: {
    id: string;
    name: string;
  } | null;
  mentor: {
    id: string;
    fullName: string;
    github: string;
  } | null;
  members: Array<{
    id: string;
    hackerId: string;
    fullName: string;
    github: string | null;
    email: string;
  }>;
}

export async function getAllTeams(eventId: string): Promise<TeamWithMembers[]> {
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
    .where(eq(teams.eventId, eventId))
    .orderBy(asc(teams.createdAt));

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

export async function getTeamById(
  teamId: string,
): Promise<TeamWithMembers | null> {
  const [teamData] = await db
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
    .where(eq(teams.id, teamId))
    .limit(1);

  if (!teamData) {
    return null;
  }

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
    .where(eq(hackerProfiles.teamId, teamData.id));

  return {
    id: teamData.id,
    eventId: teamData.eventId,
    trackId: teamData.trackId,
    trackSelectorId: teamData.trackSelectorId,
    mentorId: teamData.mentorId,
    slug: teamData.slug,
    formedOnSite: teamData.formedOnSite,
    tableNumber: teamData.tableNumber,
    createdAt: teamData.createdAt,
    updatedAt: teamData.updatedAt,
    track:
      teamData.trackName && teamData.trackId
        ? {
            id: teamData.trackId,
            name: teamData.trackName,
          }
        : null,
    mentor:
      teamData.mentorFullName && teamData.mentorGithub && teamData.mentorId
        ? {
            id: teamData.mentorId,
            fullName: teamData.mentorFullName,
            github: teamData.mentorGithub,
          }
        : null,
    members,
  };
}

export interface AvailableHacker {
  id: string;
  hackerId: string;
  fullName: string;
  github: string | null;
  email: string;
  currentTeam: {
    id: string;
    slug: string;
  } | null;
}

export async function searchAvailableHackers(
  query: string,
): Promise<AvailableHacker[]> {
  const searchPattern = `%${query}%`;

  const results = await db
    .select({
      id: hackerProfiles.id,
      hackerId: hackers.id,
      fullName: hackers.fullName,
      github: hackers.github,
      email: hackers.email,
      teamId: hackerProfiles.teamId,
      teamSlug: teams.slug,
    })
    .from(hackerProfiles)
    .innerJoin(hackers, eq(hackerProfiles.hackerId, hackers.id))
    .leftJoin(teams, eq(hackerProfiles.teamId, teams.id))
    .where(
      and(
        isNotNull(hackerProfiles.onboardCompleteAt),
        or(
          ilike(hackers.fullName, searchPattern),
          ilike(hackers.github, searchPattern),
        ),
      ),
    )
    .orderBy(asc(hackers.fullName))
    .limit(50);

  return results.map((result) => ({
    id: result.id,
    hackerId: result.hackerId,
    fullName: result.fullName,
    github: result.github,
    email: result.email,
    currentTeam:
      result.teamId && result.teamSlug
        ? {
            id: result.teamId,
            slug: result.teamSlug,
          }
        : null,
  }));
}

export async function addHackerToTeam(
  hackerProfileId: string,
  teamId: string,
): Promise<void> {
  await db
    .update(hackerProfiles)
    .set({ teamId })
    .where(eq(hackerProfiles.id, hackerProfileId));
}

export async function removeHackerFromTeam(
  hackerProfileId: string,
): Promise<void> {
  await db
    .update(hackerProfiles)
    .set({ teamId: null })
    .where(eq(hackerProfiles.id, hackerProfileId));
}

export async function createTeam(data: InsertTeam): Promise<Team> {
  const [team] = await db.insert(teams).values(data).returning();
  return team;
}

export async function updateTeam(
  teamId: string,
  data: Partial<InsertTeam>,
): Promise<Team> {
  const [team] = await db
    .update(teams)
    .set(data)
    .where(eq(teams.id, teamId))
    .returning();
  return team;
}

export async function deleteTeam(teamId: string): Promise<void> {
  await db.delete(teams).where(eq(teams.id, teamId));
}
