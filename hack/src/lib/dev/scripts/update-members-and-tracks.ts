import { eq } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import { hackerProfiles, hackers, teams, tracks } from '@/src/lib/db/schema';
import { googleSheetsService } from '@/src/services/google-sheets';

function titleize(str: string | null): string {
  if (!str) return '';
  return str
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

interface TeamData {
  slug: string;
  members: string;
  track: string;
}

async function getTeamData(): Promise<TeamData[]> {
  const allTeams = await db
    .select({
      teamId: teams.id,
      teamSlug: teams.slug,
      trackId: teams.trackId,
      trackName: tracks.name,
    })
    .from(teams)
    .leftJoin(tracks, eq(teams.trackId, tracks.id));

  const teamDataPromises = allTeams.map(async (team) => {
    const teamMembers = await db
      .select({
        fullName: hackers.fullName,
      })
      .from(hackerProfiles)
      .innerJoin(hackers, eq(hackerProfiles.hackerId, hackers.id))
      .where(eq(hackerProfiles.teamId, team.teamId));

    const sortedMembers = teamMembers
      .map((m) => m.fullName)
      .sort((a, b) => a.localeCompare(b))
      .join(';');

    return {
      slug: team.teamSlug,
      members: sortedMembers,
      track: titleize(team.trackName),
    };
  });

  return await Promise.all(teamDataPromises);
}

async function main() {
  console.log('\n🔄 Starting team members and tracks sync to spreadsheet...\n');

  try {
    console.log('📋 Fetching team data from database...\n');
    const teamData = await getTeamData();
    console.log(`✅ Found ${teamData.length} teams\n`);

    const updates: Array<{ teamSlug: string; members: string; track: string }> =
      [];
    const failed: Array<{ teamSlug: string; reason: string }> = [];

    for (const team of teamData) {
      console.log(`\n🔍 Processing team: ${team.slug}`);
      console.log(`   Members: ${team.members || '(none)'}`);
      console.log(`   Track: ${team.track || '(none)'}`);

      try {
        await googleSheetsService.updateTeamMembers(team.slug, team.members);
        await googleSheetsService.updateTeamTrack(team.slug, team.track);
        updates.push(team);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to update sheet';
        console.error(`   ❌ Error: ${errorMessage}`);
        failed.push({
          teamSlug: team.slug,
          reason: errorMessage,
        });
      }

      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    console.log('\n\n📊 Summary:');
    console.log(`✅ Successfully updated: ${updates.length} teams`);
    console.log(`❌ Failed: ${failed.length} teams`);

    if (updates.length > 0) {
      console.log('\n✅ Successfully updated teams with members and tracks');
    }

    if (failed.length > 0) {
      console.log('\n❌ Failed updates:');
      for (const { teamSlug, reason } of failed) {
        console.log(`   - ${teamSlug}: ${reason}`);
      }
    }

    console.log('\n✅ Team members and tracks sync completed!\n');
  } catch (error) {
    console.error('❌ Error in main process:', error);
    process.exit(1);
  }
}

main();
