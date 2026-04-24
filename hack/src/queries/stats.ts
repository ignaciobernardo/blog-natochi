import { and, count, eq, sql } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import { hackerProfiles, hackers, submissions } from '@/src/lib/db/schema';

export interface SubmissionStats {
  totalTeams: number;
  totalSoloParticipants: number;
  totalTeamParticipants: number;
  totalTeamLookingParticipants: number;
  totalHackers: number;
  totalHackersInTeams: number;
}

export async function getSubmissionStats(
  eventId: string,
): Promise<SubmissionStats> {
  // Get total teams (count submissions with modality = 'team')
  const [{ totalTeams }] = await db
    .select({ totalTeams: count() })
    .from(submissions)
    .where(
      and(eq(submissions.eventId, eventId), eq(submissions.modality, 'team')),
    );

  // Get total solo participants (count hacker profiles for solo submissions)
  const [{ totalSoloParticipants }] = await db
    .select({ totalSoloParticipants: count() })
    .from(hackerProfiles)
    .innerJoin(submissions, eq(hackerProfiles.submissionId, submissions.id))
    .where(
      and(eq(submissions.eventId, eventId), eq(submissions.modality, 'solo')),
    );

  // Get team participants (count hacker profiles for team submissions)
  const [{ totalTeamParticipants }] = await db
    .select({ totalTeamParticipants: count() })
    .from(hackerProfiles)
    .innerJoin(submissions, eq(hackerProfiles.submissionId, submissions.id))
    .where(
      and(eq(submissions.eventId, eventId), eq(submissions.modality, 'team')),
    );

  // Get team looking participants (count hacker profiles for team_looking submissions)
  const [{ totalTeamLookingParticipants }] = await db
    .select({ totalTeamLookingParticipants: count() })
    .from(hackerProfiles)
    .innerJoin(submissions, eq(hackerProfiles.submissionId, submissions.id))
    .where(
      and(
        eq(submissions.eventId, eventId),
        eq(submissions.modality, 'team_looking'),
      ),
    );

  // Get total hackers for this event
  const [{ totalHackers }] = await db
    .select({
      totalHackers: sql<number>`CAST(COUNT(DISTINCT ${hackers.id}) AS integer)`,
    })
    .from(hackers)
    .innerJoin(hackerProfiles, eq(hackers.id, hackerProfiles.hackerId))
    .innerJoin(submissions, eq(hackerProfiles.submissionId, submissions.id))
    .where(eq(submissions.eventId, eventId));

  // Total hackers in teams = same as totalTeamParticipants
  const totalHackersInTeams = totalTeamParticipants;

  return {
    totalTeams,
    totalSoloParticipants,
    totalTeamParticipants,
    totalTeamLookingParticipants,
    totalHackers,
    totalHackersInTeams,
  };
}
