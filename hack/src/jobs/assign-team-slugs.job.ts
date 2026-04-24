import { eq, sql } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import { hackerProfiles, teams } from '@/src/lib/db/schema';

export async function assignTeamSlugs() {
  console.log('[ASSIGN-TEAM-SLUGS] Starting team slug assignment process...');

  try {
    const allTeams = await db
      .select({
        id: teams.id,
        slug: teams.slug,
      })
      .from(teams);

    console.log(`[ASSIGN-TEAM-SLUGS] Found ${allTeams.length} teams`);

    const teamsWithMemberCount = await Promise.all(
      allTeams.map(async (team) => {
        const [result] = await db
          .select({
            count: sql<number>`count(*)::int`,
          })
          .from(hackerProfiles)
          .where(eq(hackerProfiles.teamId, team.id));

        return {
          ...team,
          memberCount: result.count,
        };
      }),
    );

    const teamsToDelete = teamsWithMemberCount.filter(
      (t) => t.memberCount === 0,
    );
    const soloTeams = teamsWithMemberCount.filter((t) => t.memberCount === 1);
    const regularTeams = teamsWithMemberCount.filter((t) => t.memberCount >= 2);

    console.log(
      `[ASSIGN-TEAM-SLUGS] Teams to delete: ${teamsToDelete.length}, Solo teams: ${soloTeams.length}, Regular teams: ${regularTeams.length}`,
    );

    let deleteCount = 0;
    for (const team of teamsToDelete) {
      try {
        await db.delete(teams).where(eq(teams.id, team.id));
        deleteCount++;
        console.log(`[ASSIGN-TEAM-SLUGS] Deleted team ${team.id} (0 members)`);
      } catch (error) {
        console.error(
          `[ASSIGN-TEAM-SLUGS] Error deleting team ${team.id}:`,
          error,
        );
      }
    }

    let soloSlugNumber = 1;
    let soloUpdateCount = 0;
    for (const team of soloTeams) {
      try {
        const newSlug = `solo-${soloSlugNumber}`;
        await db
          .update(teams)
          .set({ slug: newSlug })
          .where(eq(teams.id, team.id));
        soloUpdateCount++;
        console.log(
          `[ASSIGN-TEAM-SLUGS] Updated team ${team.id} to slug: ${newSlug}`,
        );
        soloSlugNumber++;
      } catch (error) {
        console.error(
          `[ASSIGN-TEAM-SLUGS] Error updating solo team ${team.id}:`,
          error,
        );
      }
    }

    let teamSlugNumber = 1;
    let teamUpdateCount = 0;
    for (const team of regularTeams) {
      try {
        const newSlug = `team-${teamSlugNumber}`;
        await db
          .update(teams)
          .set({ slug: newSlug })
          .where(eq(teams.id, team.id));
        teamUpdateCount++;
        console.log(
          `[ASSIGN-TEAM-SLUGS] Updated team ${team.id} to slug: ${newSlug}`,
        );
        teamSlugNumber++;
      } catch (error) {
        console.error(
          `[ASSIGN-TEAM-SLUGS] Error updating regular team ${team.id}:`,
          error,
        );
      }
    }

    console.log(
      `[ASSIGN-TEAM-SLUGS] Completed. Deleted: ${deleteCount}, Solo teams updated: ${soloUpdateCount}, Regular teams updated: ${teamUpdateCount}`,
    );
  } catch (error) {
    console.error('[ASSIGN-TEAM-SLUGS] Fatal error:', error);
    throw error;
  }
}
