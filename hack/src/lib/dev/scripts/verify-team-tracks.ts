import { eq, inArray } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import { teams, tracks } from '@/src/lib/db/schema';

const teamSlugs = ['team-7', 'solo-5', 'team-11', 'team-31'];

async function verifyTeamTracks() {
  console.log('Verifying team tracks...\n');

  const teamsData = await db
    .select({
      slug: teams.slug,
      trackId: teams.trackId,
      trackName: tracks.name,
    })
    .from(teams)
    .leftJoin(tracks, eq(teams.trackId, tracks.id))
    .where(inArray(teams.slug, teamSlugs))
    .orderBy(teams.slug);

  console.log('Team Track Assignments:');
  console.log('─'.repeat(60));

  for (const team of teamsData) {
    const trackDisplay = team.trackName || 'No track assigned';
    console.log(`${team.slug.padEnd(15)} → ${trackDisplay}`);
  }

  console.log('\n✅ Verification complete');
}

verifyTeamTracks()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
