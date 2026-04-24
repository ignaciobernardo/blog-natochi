import { and, eq, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/src/lib/db';
import { teams } from '@/src/lib/db/schema';
import { getDefaultEvent } from '@/src/queries/events';
import {
  checkAllTeamsSelectedMentor,
  getAllMentors,
  getAllMentorsWithTeams,
} from '@/src/queries/mentors';

const MENTOR_BLACKLIST = [
  'Ana Undurraga',
  'Pedro Saratscheff',
  'Vicente Aguilera',
  'Ramón Echeverría',
];

export interface MentorAvailability {
  id: string;
  fullName: string;
  github: string;
  linkedin: string | null;
  companyTitle: string | null;
  pictureUrl: string | null;
  availableSpots: number | null;
  totalSpots: number | null;
  currentTeams: number;
}

export interface MentorAvailabilityResponse {
  mentors: MentorAvailability[];
  mentorSelectionStartTime: string | null;
  mentorSelectionStarted: boolean;
  teamsWithoutMentor: number;
  allTeamsSelected?: boolean;
  mentorsWithTeams?: Array<{
    id: string;
    fullName: string;
    github: string;
    linkedin: string | null;
    companyTitle: string | null;
    teams: Array<{
      id: string;
      slug: string;
      members: Array<{
        github: string | null;
      }>;
    }>;
  }>;
}

export async function GET() {
  try {
    const event = await getDefaultEvent();

    if (!event) {
      return NextResponse.json({ error: 'No event found' }, { status: 404 });
    }

    const allMentors = await getAllMentors(event.id);

    const filteredMentors = allMentors.filter(
      (mentor) => !MENTOR_BLACKLIST.includes(mentor.fullName),
    );

    const mentorAvailability: MentorAvailability[] = await Promise.all(
      filteredMentors.map(async (mentor) => {
        const [result] = await db
          .select({
            count: sql<number>`cast(count(*) as int)`,
          })
          .from(teams)
          .where(
            and(eq(teams.mentorId, mentor.id), eq(teams.eventId, event.id)),
          );

        const currentTeams = result?.count || 0;
        const totalSpots = event.mentorTeamLimit;
        const availableSpots =
          totalSpots !== null ? totalSpots - currentTeams : null;

        return {
          id: mentor.id,
          fullName: mentor.fullName,
          github: mentor.github,
          linkedin: mentor.linkedin,
          companyTitle: mentor.companyTitle,
          pictureUrl: mentor.pictureUrl,
          availableSpots,
          totalSpots,
          currentTeams,
        };
      }),
    );

    const now = new Date();
    const mentorSelectionStarted = event.mentorSelectionStartTime
      ? now >= event.mentorSelectionStartTime
      : false;

    const allTeamsSelected = await checkAllTeamsSelectedMentor(event.id);
    const mentorsWithTeams = allTeamsSelected
      ? await getAllMentorsWithTeams(event.id)
      : undefined;

    // Count teams without mentors
    const [teamsWithoutMentorResult] = await db
      .select({
        count: sql<number>`cast(count(*) as int)`,
      })
      .from(teams)
      .where(and(eq(teams.eventId, event.id), sql`${teams.mentorId} IS NULL`));

    const teamsWithoutMentor = teamsWithoutMentorResult?.count || 0;

    const response: MentorAvailabilityResponse = {
      mentors: mentorAvailability,
      mentorSelectionStartTime:
        event.mentorSelectionStartTime?.toISOString() || null,
      mentorSelectionStarted,
      teamsWithoutMentor,
      allTeamsSelected,
      mentorsWithTeams,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching mentor availability:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mentor availability' },
      { status: 500 },
    );
  }
}
