import { and, asc, desc, eq, isNotNull, sql } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import {
  hackerProfiles,
  hackers,
  type InsertMentor,
  mentors,
  teams,
} from '@/src/lib/db/schema';

const MENTOR_BLACKLIST = [
  'Ana Undurraga',
  'Pedro Saratscheff',
  'Vicente Aguilera',
  'Ramón Echeverría',
];

export async function getAllMentors(eventId: string) {
  return db
    .select()
    .from(mentors)
    .where(eq(mentors.eventId, eventId))
    .orderBy(desc(mentors.createdAt));
}

export async function getMentorById(id: string, eventId?: string) {
  const [mentor] = await db
    .select()
    .from(mentors)
    .where(
      eventId
        ? and(eq(mentors.id, id), eq(mentors.eventId, eventId))
        : eq(mentors.id, id),
    )
    .limit(1);
  return mentor;
}

export async function createMentor(data: Omit<InsertMentor, 'id'>) {
  const [mentor] = await db.insert(mentors).values(data).returning();
  return mentor;
}

export async function updateMentor(
  id: string,
  eventId: string,
  data: Partial<Omit<InsertMentor, 'id'>>,
) {
  const [mentor] = await db
    .update(mentors)
    .set(data)
    .where(and(eq(mentors.id, id), eq(mentors.eventId, eventId)))
    .returning();
  return mentor;
}

export async function deleteMentor(id: string, eventId: string) {
  await db
    .delete(mentors)
    .where(and(eq(mentors.id, id), eq(mentors.eventId, eventId)));
}

export interface MentorWithTeams {
  id: string;
  fullName: string;
  github: string;
  linkedin: string | null;
  companyTitle: string | null;
  teams: Array<{
    id: string;
    slug: string;
    members: Array<{
      id: string;
      github: string | null;
    }>;
  }>;
}

export async function checkAllTeamsSelectedMentor(
  eventId: string,
): Promise<boolean> {
  const [totalTeams] = await db
    .select({
      count: sql<number>`cast(count(*) as int)`,
    })
    .from(teams)
    .where(eq(teams.eventId, eventId));

  const [teamsWithMentor] = await db
    .select({
      count: sql<number>`cast(count(*) as int)`,
    })
    .from(teams)
    .where(and(eq(teams.eventId, eventId), isNotNull(teams.mentorId)));

  const total = totalTeams?.count || 0;
  const withMentor = teamsWithMentor?.count || 0;

  return total > 0 && total === withMentor;
}

export async function getAllMentorsWithTeams(
  eventId: string,
): Promise<MentorWithTeams[]> {
  const allMentors = await db
    .select()
    .from(mentors)
    .where(eq(mentors.eventId, eventId))
    .orderBy(asc(mentors.fullName));

  const filteredMentors = allMentors.filter(
    (mentor) => !MENTOR_BLACKLIST.includes(mentor.fullName),
  );

  const mentorsWithTeams: MentorWithTeams[] = await Promise.all(
    filteredMentors.map(async (mentor) => {
      const teamsData = await db
        .select({
          id: teams.id,
          slug: teams.slug,
        })
        .from(teams)
        .where(and(eq(teams.eventId, eventId), eq(teams.mentorId, mentor.id)))
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
        id: mentor.id,
        fullName: mentor.fullName,
        github: mentor.github,
        linkedin: mentor.linkedin,
        companyTitle: mentor.companyTitle,
        teams: teamsWithMembers,
      };
    }),
  );

  return mentorsWithTeams.filter((mentor) => mentor.teams.length > 0);
}
