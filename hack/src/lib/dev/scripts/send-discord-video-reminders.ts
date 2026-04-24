import { eq } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import { presentationUploads, teams } from '@/src/lib/db/schema';
import { discordService } from '@/src/services/discord';
import { googleSheetsService } from '@/src/services/google-sheets';

const DRY_RUN = process.env.DRY_RUN === 'true';
const TEAM_SLUG = process.argv[2]; // CLI parameter for specific team

async function sendDiscordVideoReminders(): Promise<void> {
  console.log(`\n${'='.repeat(80)}`);
  console.log('Send Discord Video Upload Reminders');
  console.log(`${'='.repeat(80)}\n`);

  if (DRY_RUN) {
    console.log('🔍 DRY RUN MODE - No messages will be sent\n');
  }

  try {
    // Get tracking data from Google Sheets
    console.log('📊 Fetching team upload tracking data...');
    const trackingData = await googleSheetsService.getTeamUploadTracking();
    console.log(`✅ Found ${trackingData.length} teams in tracking sheet\n`);

    // Filter teams that have uploaded slides or demo
    let teamsWithVideos = trackingData.filter(
      (team) =>
        (team.slidesUpdatedAt && team.slidesUpdatedAt.trim() !== '') ||
        (team.demoUpdatedAt && team.demoUpdatedAt.trim() !== ''),
    );

    // If a specific team slug was provided, filter to just that team
    if (TEAM_SLUG) {
      const filteredTeams = teamsWithVideos.filter(
        (team) => team.teamSlug === TEAM_SLUG,
      );
      if (filteredTeams.length === 0) {
        console.log(
          `❌ Team "${TEAM_SLUG}" not found with slides/demo uploads\n`,
        );
        return;
      }
      teamsWithVideos = filteredTeams;
      console.log(`📹 Running for specific team: ${TEAM_SLUG}`);
    } else {
      console.log(
        `📹 Teams with slides/demo uploads: ${teamsWithVideos.length}`,
      );
    }

    if (teamsWithVideos.length === 0) {
      console.log('⚠️  No teams have uploaded slides or demo yet\n');
      return;
    }

    console.log('');

    // Prepare team slugs for Discord messages
    const teamSlugs = teamsWithVideos.map((t) => t.teamSlug);

    // Build team upload info map
    console.log('📋 Checking upload status for each team...');
    const teamUploadMap = new Map<
      string,
      { missing: string[]; hasSomething: boolean }
    >();

    for (const trackingTeam of teamsWithVideos) {
      const [team] = await db
        .select({ id: teams.id })
        .from(teams)
        .where(eq(teams.slug, trackingTeam.teamSlug))
        .limit(1);

      if (!team) continue;

      const [upload] = await db
        .select({
          slidesUploadedAt: presentationUploads.slidesUploadedAt,
          demoUploadedAt: presentationUploads.demoUploadedAt,
        })
        .from(presentationUploads)
        .where(eq(presentationUploads.teamId, team.id))
        .limit(1);

      const missing: string[] = [];
      const hasSomething =
        upload?.slidesUploadedAt != null || upload?.demoUploadedAt != null;

      if (!upload?.slidesUploadedAt) missing.push('slides');
      if (!upload?.demoUploadedAt) missing.push('demo');

      teamUploadMap.set(trackingTeam.teamSlug, { missing, hasSomething });
    }

    console.log('✅ Upload status checked\n');

    // Message generator function with missing items
    const discordMessageGenerator = (teamSlug: string, roleId?: string) => {
      const mention = roleId ? `<@&${roleId}>` : `@${teamSlug}`;
      const uploadInfo = teamUploadMap.get(teamSlug);
      const missing = uploadInfo?.missing || ['slides', 'demo'];

      let missingText: string;
      if (missing.length === 2) {
        missingText = 'su demo / slides';
      } else if (missing.includes('slides')) {
        missingText = 'sus slides';
      } else {
        missingText = 'su demo';
      }

      return (
        `Hola ${mention}!\n\n` +
        `Recuerden enviar ${missingText} para que podamos entregarle un video de buena calidad de su presentación.\n\n` +
        'Gracias!'
      );
    };

    if (teamsWithVideos.length > 0) {
      console.log('Discord Message Template (example with first team):');
      console.log('-'.repeat(80));
      console.log(
        discordMessageGenerator(teamSlugs[0] || 'team-name', 'ROLE_ID_EXAMPLE'),
      );
      console.log(`${'-'.repeat(80)}\n`);
    }

    if (DRY_RUN) {
      console.log(
        `[DRY RUN] Would send reminders to ${teamSlugs.length} teams:`,
      );
      teamSlugs.forEach((slug) => {
        console.log(`  - #${slug}`);
      });
    } else {
      console.log(
        `📢 Sending Discord reminders to ${teamSlugs.length} teams...\n`,
      );

      const { sent, failed, skipped } =
        await discordService.sendBulkReminderMessages(
          teamSlugs,
          discordMessageGenerator,
        );

      console.log(`\n${'='.repeat(80)}`);
      console.log('Summary');
      console.log('='.repeat(80));
      console.log(`✅ Reminders sent: ${sent}`);
      if (skipped > 0) {
        console.log(`⏭️  Skipped (already sent recently): ${skipped}`);
      }
      if (failed > 0) {
        console.warn(`⚠️  Reminders failed: ${failed}`);
      }
      console.log('');
    }

    console.log('✅ Script completed successfully\n');
  } catch (error) {
    console.error('\n❌ Error sending Discord reminders:', error);
    throw error;
  }
}

sendDiscordVideoReminders()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
