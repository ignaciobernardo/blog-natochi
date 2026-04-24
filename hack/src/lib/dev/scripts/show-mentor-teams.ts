import { and, asc, desc, eq } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import {
  events,
  hackerProfiles,
  hackers,
  mentors,
  submissions,
  teams,
} from '@/src/lib/db/schema';

interface MentorTeamInfo {
  mentor: {
    id: string;
    fullName: string;
    github: string;
  };
  teams: Array<{
    tableNumber: string | null;
    slug: string;
    hackerNames: string[];
  }>;
}

async function showMentorTeams() {
  // Get the event that has teams (or most recent if none have teams)
  const allEvents = await db
    .select({
      id: events.id,
      name: events.name,
    })
    .from(events)
    .orderBy(desc(events.createdAt));

  if (allEvents.length === 0) {
    console.error('No event found');
    process.exit(1);
  }

  // Find event with teams, or use most recent
  let event = allEvents[0];
  for (const e of allEvents) {
    const teamCount = await db
      .select()
      .from(teams)
      .where(eq(teams.eventId, e.id))
      .limit(1);
    if (teamCount.length > 0) {
      event = e;
      break;
    }
  }

  console.log(`\n📋 Mentor Teams Report for Event: ${event.name}\n`);
  console.log('='.repeat(80));

  // Get all teams with their mentors
  const teamsData = await db
    .select({
      teamId: teams.id,
      teamSlug: teams.slug,
      teamTableNumber: teams.tableNumber,
      mentorId: mentors.id,
      mentorFullName: mentors.fullName,
      mentorGithub: mentors.github,
    })
    .from(teams)
    .leftJoin(mentors, eq(teams.mentorId, mentors.id))
    .where(eq(teams.eventId, event.id))
    .orderBy(asc(mentors.fullName), asc(teams.tableNumber));

  console.log(`\nTotal teams found: ${teamsData.length}\n`);

  // Group teams by mentor
  const mentorTeamsMap = new Map<string, MentorTeamInfo>();
  const teamsWithoutMentors: Array<{
    tableNumber: string | null;
    slug: string | null;
    hackerNames: string[];
  }> = [];

  for (const teamRow of teamsData) {
    // Get hacker names for this team using hackerProfiles table
    const teamHackers = await db
      .select({
        fullName: hackers.fullName,
      })
      .from(hackerProfiles)
      .innerJoin(hackers, eq(hackerProfiles.hackerId, hackers.id))
      .innerJoin(submissions, eq(hackerProfiles.submissionId, submissions.id))
      .where(
        and(
          eq(hackerProfiles.teamId, teamRow.teamId),
          eq(submissions.eventId, event.id),
        ),
      )
      .orderBy(asc(hackers.fullName));

    const hackerNames = teamHackers.map((h) => h.fullName);

    // Track teams without mentors
    if (!teamRow.mentorId || !teamRow.mentorFullName || !teamRow.mentorGithub) {
      teamsWithoutMentors.push({
        tableNumber: teamRow.teamTableNumber,
        slug: teamRow.teamSlug,
        hackerNames,
      });
      continue;
    }

    const mentorId = teamRow.mentorId;

    if (!mentorTeamsMap.has(mentorId)) {
      mentorTeamsMap.set(mentorId, {
        mentor: {
          id: teamRow.mentorId,
          fullName: teamRow.mentorFullName,
          github: teamRow.mentorGithub,
        },
        teams: [],
      });
    }

    const mentorInfo = mentorTeamsMap.get(mentorId);
    if (!mentorInfo) {
      throw new Error(`Mentor info not found for ID: ${mentorId}`);
    }

    mentorInfo.teams.push({
      tableNumber: teamRow.teamTableNumber,
      slug: teamRow.teamSlug || 'No slug',
      hackerNames,
    });
  }

  // Sort mentors by name
  const sortedMentors = Array.from(mentorTeamsMap.values()).sort((a, b) =>
    a.mentor.fullName.localeCompare(b.mentor.fullName),
  );

  // Display results
  for (const mentorInfo of sortedMentors) {
    console.log(`\n👨‍🏫 Mentor: ${mentorInfo.mentor.fullName}`);
    console.log(`   GitHub: ${mentorInfo.mentor.github}`);
    console.log(`   Teams: ${mentorInfo.teams.length}`);

    // Sort teams by table number (nulls last)
    const sortedTeams = mentorInfo.teams.sort((a, b) => {
      if (a.tableNumber === null && b.tableNumber === null) return 0;
      if (a.tableNumber === null) return 1;
      if (b.tableNumber === null) return -1;
      return a.tableNumber.localeCompare(b.tableNumber);
    });

    for (const team of sortedTeams) {
      const tableDisplay = team.tableNumber || 'No table assigned';
      console.log(`\n   📍 Table: ${tableDisplay} | Team: ${team.slug}`);
      console.log(`   👥 Hackers (${team.hackerNames.length}):`);
      for (const hackerName of team.hackerNames) {
        console.log(`      • ${hackerName}`);
      }
    }
    console.log(`\n${'-'.repeat(80)}`);
  }

  // Summary
  const totalMentors = sortedMentors.length;
  const totalTeams = sortedMentors.reduce((sum, m) => sum + m.teams.length, 0);
  const totalHackers = sortedMentors.reduce(
    (sum, m) =>
      sum + m.teams.reduce((teamSum, t) => teamSum + t.hackerNames.length, 0),
    0,
  );

  // Show teams without mentors if any (only show first 10 to avoid spam)
  if (teamsWithoutMentors.length > 0) {
    const teamsToShow = teamsWithoutMentors.slice(0, 10);
    console.log(
      `\n⚠️  Teams without mentors assigned (${teamsWithoutMentors.length}, showing first 10):\n`,
    );
    for (const team of teamsToShow) {
      const tableDisplay = team.tableNumber || 'No table assigned';
      const slugDisplay = team.slug || 'No slug';
      console.log(`   📍 Table: ${tableDisplay} | Team: ${slugDisplay}`);
      console.log(`   👥 Hackers (${team.hackerNames.length}):`);
      if (team.hackerNames.length > 0) {
        for (const hackerName of team.hackerNames) {
          console.log(`      • ${hackerName}`);
        }
      } else {
        console.log(`      (no hackers found)`);
      }
      console.log('');
    }
    if (teamsWithoutMentors.length > 10) {
      console.log(
        `   ... and ${teamsWithoutMentors.length - 10} more teams without mentors\n`,
      );
    }
    console.log('-'.repeat(80));
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Total Mentors with Teams: ${totalMentors}`);
  console.log(`   Total Teams with Mentors: ${totalTeams}`);
  console.log(`   Total Hackers in Teams with Mentors: ${totalHackers}`);
  console.log(`   Teams without Mentors: ${teamsWithoutMentors.length}`);
  console.log(`   Total Teams: ${teamsData.length}`);
  console.log('\n');
}

showMentorTeams()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
