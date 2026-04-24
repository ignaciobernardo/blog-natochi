import { and, desc, eq, inArray } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import {
  hackerProfiles,
  hackers,
  outboundEmails,
  presentationUploads,
  teams,
} from '@/src/lib/db/schema';
import { rawVideoReminderEmailSender } from '@/src/operators/emails/teams/raw-video-reminder-email-sender';
import { discordService } from '@/src/services/discord';
import { googleSheetsService } from '@/src/services/google-sheets';

const CHILE_TIMEZONE_OFFSET = -3 * 60; // Chile is UTC-3

function _getChileDate(): Date {
  const now = new Date();
  const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
  const chileTime = new Date(utcTime + CHILE_TIMEZONE_OFFSET * 60000);
  return chileTime;
}

function isNov26(date: Date): boolean {
  const chileDate = new Date(
    date.getTime() +
      date.getTimezoneOffset() * 60000 +
      CHILE_TIMEZONE_OFFSET * 60000,
  );
  return (
    chileDate.getFullYear() === 2025 &&
    chileDate.getMonth() === 10 && // November is month 10 (0-indexed)
    chileDate.getDate() === 26
  );
}

function isAfter10amNov27(now: Date): boolean {
  const chileNow = new Date(
    now.getTime() +
      now.getTimezoneOffset() * 60000 +
      CHILE_TIMEZONE_OFFSET * 60000,
  );

  if (
    chileNow.getFullYear() !== 2025 ||
    chileNow.getMonth() !== 10 || // November
    chileNow.getDate() !== 27
  ) {
    return false;
  }

  return chileNow.getHours() >= 10;
}

function shouldSendReminder(lastEmailSentAt: Date | null, now: Date): boolean {
  if (!lastEmailSentAt) {
    // No email sent yet, should send
    return true;
  }

  // Special case: If first email was sent on Nov 26, check if it's after 10am Nov 27
  if (isNov26(lastEmailSentAt)) {
    return isAfter10amNov27(now);
  }

  // Regular case: 24 hours have passed
  const hoursSinceLastEmail =
    (now.getTime() - lastEmailSentAt.getTime()) / (1000 * 60 * 60);

  return hoursSinceLastEmail >= 24;
}

export async function remindRawVideoUploads(): Promise<void> {
  console.log('\n🎥 Checking for teams with raw video URLs to remind...\n');

  try {
    const now = new Date();

    // Get tracking data from Google Sheets
    const trackingData = await googleSheetsService.getTeamUploadTracking();

    console.log(`Found ${trackingData.length} teams in tracking sheet`);

    // Include all teams that have an upload folder URL (whether they've uploaded or not)
    const teamsWithVideos = trackingData.filter(
      (team) => team.uploadFolderUrl && team.uploadFolderUrl.trim() !== '',
    );

    console.log(
      `Found ${teamsWithVideos.length} teams with upload folder URLs`,
    );

    if (teamsWithVideos.length === 0) {
      console.log('⚠️  No teams have upload folder URLs');
      return;
    }

    let remindersCount = 0;
    const discordReminderTeamSlugs: string[] = [];
    const teamUploadMap = new Map<
      string,
      { missing: string[]; hasSomething: boolean }
    >();

    for (const trackingTeam of teamsWithVideos) {
      // Get team from database
      const [team] = await db
        .select({ id: teams.id, slug: teams.slug })
        .from(teams)
        .where(eq(teams.slug, trackingTeam.teamSlug))
        .limit(1);

      if (!team) {
        console.warn(`Team not found in database: ${trackingTeam.teamSlug}`);
        continue;
      }

      // Check what files are missing before sending any reminders
      const [upload] = await db
        .select({
          slidesUploadedAt: presentationUploads.slidesUploadedAt,
          demoUploadedAt: presentationUploads.demoUploadedAt,
        })
        .from(presentationUploads)
        .where(eq(presentationUploads.teamId, team.id))
        .limit(1);

      const missing: string[] = [];
      if (!upload?.slidesUploadedAt) missing.push('slides');
      if (!upload?.demoUploadedAt) missing.push('demo');

      // Skip teams that have uploaded everything
      if (missing.length === 0) {
        console.log(`⏭️  Skipping ${team.slug}: All files already uploaded`);
        continue;
      }

      // Store upload info for Discord message generation
      const hasSomething =
        upload?.slidesUploadedAt != null || upload?.demoUploadedAt != null;
      teamUploadMap.set(trackingTeam.teamSlug, { missing, hasSomething });

      // Get team members
      const members = await db
        .select({
          email: hackers.email,
          fullName: hackers.fullName,
        })
        .from(hackerProfiles)
        .innerJoin(hackers, eq(hackerProfiles.hackerId, hackers.id))
        .where(eq(hackerProfiles.teamId, team.id));

      if (members.length === 0) {
        console.warn(`No members found for team ${team.slug}`);
        continue;
      }

      const memberEmails = members.map((m) => m.email);

      // Check if we've sent a reminder email to any team member recently
      const recentEmails = await db
        .select({
          to: outboundEmails.to,
          sentAt: outboundEmails.sentAt,
          createdAt: outboundEmails.createdAt,
        })
        .from(outboundEmails)
        .where(
          and(
            inArray(outboundEmails.to, memberEmails),
            eq(outboundEmails.templateName, 'raw-video-reminder'),
            eq(outboundEmails.status, 'sent'),
          ),
        )
        .orderBy(desc(outboundEmails.sentAt));

      const lastEmailSentAt =
        recentEmails.length > 0 ? recentEmails[0].sentAt : null;

      if (!shouldSendReminder(lastEmailSentAt, now)) {
        console.log(
          `⏭️  Skipping ${team.slug}: Last email sent too recently (${lastEmailSentAt})`,
        );
        continue;
      }

      // Check if upload folder URL is available
      if (!trackingTeam.uploadFolderUrl) {
        console.warn(
          `⚠️  Skipping ${team.slug}: No upload folder URL in tracking sheet`,
        );
        continue;
      }

      // Send reminder emails
      await rawVideoReminderEmailSender.sendToAllMembers({
        teamId: team.id,
        teamSlug: team.slug,
        uploadFolderUrl: trackingTeam.uploadFolderUrl,
        videoUrl: trackingTeam.videoUrl || undefined,
        members,
      });

      remindersCount++;
      console.log(`✅ Sent reminder to ${team.slug}`);

      // Mark team for Discord reminder since we just sent an email
      discordReminderTeamSlugs.push(trackingTeam.teamSlug);
    }

    // Send Discord reminders with rate limiting
    if (discordReminderTeamSlugs.length > 0) {
      console.log(
        `\n📢 Sending Discord reminders to ${discordReminderTeamSlugs.length} team channels...`,
      );

      const discordMessageGenerator = (teamSlug: string, roleId?: string) => {
        const mention = roleId ? `<@&${roleId}>` : `@${teamSlug}`;
        const uploadInfo = teamUploadMap.get(teamSlug);
        const missing = uploadInfo?.missing || ['slides', 'demo'];
        const trackingTeam = teamsWithVideos.find(
          (t) => t.teamSlug === teamSlug,
        );

        const formatTimestamp = (dateStr: string | null | undefined) => {
          if (!dateStr) return '';
          try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('es-CL', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });
          } catch {
            return dateStr;
          }
        };

        let contentList =
          'Aún les falta subir contenido para podamos entregarle un buen video de su presentación:\n';

        // Slides status
        if (missing.includes('slides')) {
          contentList += '• ❌ slides en formato PDF\n';
        } else {
          contentList += `• ✅ slides (subidas el ${formatTimestamp(trackingTeam?.slidesUpdatedAt)})\n`;
        }

        // Demo status
        if (missing.includes('demo')) {
          const demoLink = trackingTeam?.videoUrl
            ? `[demo sincronizado con su presentación](${trackingTeam.videoUrl})`
            : 'demo sincronizado con su presentación';
          contentList += `• ❌ ${demoLink}\n`;
        } else {
          contentList += `• ✅ demo sincronizado con su presentación (subido el ${formatTimestamp(trackingTeam?.demoUpdatedAt)})\n`;
        }

        const driveLink = trackingTeam?.uploadFolderUrl
          ? `[esta carpeta de Drive](${trackingTeam.uploadFolderUrl})`
          : 'esta carpeta de Drive';

        return (
          `Hola ${mention}!\n\n` +
          contentList +
          `\nDeben subir el contenido a ${driveLink}`
        );
      };

      const result = await discordService.sendBulkReminderMessages(
        discordReminderTeamSlugs,
        discordMessageGenerator,
      );

      console.log(`  ✅ Discord reminders sent: ${result.sent}`);
      if (result.failed > 0) {
        console.warn(`  ⚠️  Discord reminders failed: ${result.failed}`);
      }
    }

    console.log('\n📊 Summary:');
    console.log(`📧 Reminders sent: ${remindersCount}`);
    console.log(`⏭️  Skipped: ${teamsWithVideos.length - remindersCount}`);
    console.log(`✅ Check completed successfully\n`);
  } catch (error) {
    console.error('❌ Error checking raw video uploads:', error);
    throw error;
  }
}
