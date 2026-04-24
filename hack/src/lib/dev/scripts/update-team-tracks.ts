import { and, desc, eq, ilike, isNotNull, or } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import {
  hackerProfiles,
  hackers,
  submissions,
  teams,
  tracks,
} from '@/src/lib/db/schema';
import { getDefaultEvent } from '@/src/queries/events';

interface TrackAssignment {
  githubUsername: string;
  trackName: string;
}

const assignments: TrackAssignment[] = [
  { githubUsername: 'jeremy-jmc', trackName: '✨ consumer AI' },
  { githubUsername: 'viktorvillalobos', trackName: '🦾 human enhancement' },
  {
    githubUsername: 'AndresGonzalez5',
    trackName: '🛡️ fintech + digital security',
  },
  { githubUsername: 'rmena1', trackName: '✨ consumer AI' },
];

async function updateTeamTracks() {
  console.log('Getting default event...');
  const defaultEvent = await getDefaultEvent();

  if (!defaultEvent) {
    console.error('No default event found');
    process.exit(1);
  }

  console.log(`Using event: ${defaultEvent.name} (${defaultEvent.id})\n`);

  for (const assignment of assignments) {
    console.log(
      `Processing ${assignment.githubUsername} -> ${assignment.trackName}`,
    );

    // Find hacker by GitHub username (handle both URL and username formats)
    const githubUrl = `https://github.com/${assignment.githubUsername}`;
    const [hacker] = await db
      .select()
      .from(hackers)
      .where(
        or(
          eq(hackers.github, assignment.githubUsername),
          eq(hackers.github, githubUrl),
          ilike(hackers.github, `%${assignment.githubUsername}%`),
        ),
      )
      .limit(1);

    if (!hacker) {
      console.log(`  ❌ Hacker not found: ${assignment.githubUsername}`);
      continue;
    }

    console.log(`  ✓ Found hacker: ${hacker.fullName} (${hacker.id})`);

    let teamId: string | null = null;
    const [profile] = await db
      .select({
        teamId: hackerProfiles.teamId,
      })
      .from(hackerProfiles)
      .innerJoin(submissions, eq(hackerProfiles.submissionId, submissions.id))
      .where(
        and(
          eq(hackerProfiles.hackerId, hacker.id),
          eq(submissions.eventId, defaultEvent.id),
          isNotNull(hackerProfiles.teamId),
        ),
      )
      .orderBy(desc(hackerProfiles.createdAt))
      .limit(1);

    if (profile?.teamId) {
      teamId = profile.teamId;
    }

    if (!teamId) {
      console.log(
        `  ❌ Team not found for hacker: ${assignment.githubUsername}`,
      );
      continue;
    }

    const [team] = await db
      .select()
      .from(teams)
      .where(eq(teams.id, teamId))
      .limit(1);

    if (!team) {
      console.log(`  ❌ Team record not found: ${teamId}`);
      continue;
    }
    console.log(`  ✓ Found team: ${team.slug} (${team.id})`);

    // Find track by name
    const [track] = await db
      .select()
      .from(tracks)
      .where(
        and(
          eq(tracks.name, assignment.trackName),
          eq(tracks.eventId, defaultEvent.id),
        ),
      )
      .limit(1);

    if (!track) {
      console.log(`  ❌ Track not found: ${assignment.trackName}`);
      continue;
    }

    console.log(`  ✓ Found track: ${track.name} (${track.id})`);

    // Update team's trackId
    await db
      .update(teams)
      .set({ trackId: track.id })
      .where(eq(teams.id, team.id));

    console.log(`  ✅ Updated team ${team.slug} to track: ${track.name}\n`);
  }

  console.log('✅ All updates completed successfully!');
}

updateTeamTracks()
  .then(() => {
    console.log('Script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
