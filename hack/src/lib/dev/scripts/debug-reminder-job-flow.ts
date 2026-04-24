import { and, desc, eq, inArray } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import {
  hackerProfiles,
  hackers,
  outboundEmails,
  presentationUploads,
  teams,
} from '@/src/lib/db/schema';
import { googleSheetsService } from '@/src/services/google-sheets';

const CHILE_TIMEZONE_OFFSET = -3 * 60;

function isAfter10amNov27(now: Date): boolean {
  const chileNow = new Date(
    now.getTime() +
      now.getTimezoneOffset() * 60000 +
      CHILE_TIMEZONE_OFFSET * 60000,
  );

  if (
    chileNow.getFullYear() !== 2025 ||
    chileNow.getMonth() !== 10 ||
    chileNow.getDate() !== 27
  ) {
    return false;
  }

  return chileNow.getHours() >= 10;
}

function shouldSendReminder(lastEmailSentAt: Date | null, now: Date): boolean {
  if (!lastEmailSentAt) {
    return true;
  }

  if (isNov26(lastEmailSentAt)) {
    return isAfter10amNov27(now);
  }

  const hoursSinceLastEmail =
    (now.getTime() - lastEmailSentAt.getTime()) / (1000 * 60 * 60);

  return hoursSinceLastEmail >= 24;
}

function isNov26(date: Date): boolean {
  const chileDate = new Date(
    date.getTime() +
      date.getTimezoneOffset() * 60000 +
      CHILE_TIMEZONE_OFFSET * 60000,
  );
  return (
    chileDate.getFullYear() === 2025 &&
    chileDate.getMonth() === 10 &&
    chileDate.getDate() === 26
  );
}

async function main() {
  console.log('\n🔍 SIMULATING REMIND-RAW-VIDEO-UPLOADS JOB\n');

  const now = new Date();

  // Get tracking data
  const trackingData = await googleSheetsService.getTeamUploadTracking();
  console.log(`Found ${trackingData.length} teams in tracking sheet\n`);

  // Include all teams with upload folder URLs
  const teamsWithVideos = trackingData.filter(
    (team) => team.uploadFolderUrl && team.uploadFolderUrl.trim() !== '',
  );

  console.log(
    `Found ${teamsWithVideos.length} teams with upload folder URLs\n`,
  );

  // Build upload map
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

  // Check which teams would get email reminders
  console.log('📧 EMAIL REMINDER CANDIDATES:');
  console.log('='.repeat(60));

  const emailReminderTeams: string[] = [];

  for (const trackingTeam of teamsWithVideos) {
    const [team] = await db
      .select({ id: teams.id, slug: teams.slug })
      .from(teams)
      .where(eq(teams.slug, trackingTeam.teamSlug))
      .limit(1);

    if (!team) continue;

    // Check what files are missing
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

    // Skip teams with no missing files
    if (missing.length === 0) {
      console.log(`\n${team.slug}:`);
      console.log(`  Missing Files: NONE`);
      console.log(`  Should Send: ❌ NO (all files uploaded)`);
      continue;
    }

    const members = await db
      .select({
        email: hackers.email,
      })
      .from(hackerProfiles)
      .innerJoin(hackers, eq(hackerProfiles.hackerId, hackers.id))
      .where(eq(hackerProfiles.teamId, team.id));

    const memberEmails = members.map((m) => m.email);

    const recentEmails = await db
      .select({
        sentAt: outboundEmails.sentAt,
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

    const shouldSend = shouldSendReminder(lastEmailSentAt, now);

    console.log(`\n${team.slug}:`);
    console.log(`  Missing Files: ${missing.join(', ')}`);
    console.log(`  Last Email: ${lastEmailSentAt || 'NEVER'}`);
    console.log(`  Should Send: ${shouldSend ? '✅ YES' : '❌ NO'}`);

    if (shouldSend) {
      emailReminderTeams.push(team.slug);
    }
  }

  // Check which teams would get Discord reminders
  console.log('\n\n🤖 DISCORD REMINDER CANDIDATES:');
  console.log('='.repeat(60));

  const discordReminderTeams: string[] = [];

  for (const trackingTeam of teamsWithVideos) {
    const [team] = await db
      .select({ id: teams.id, slug: teams.slug })
      .from(teams)
      .where(eq(teams.slug, trackingTeam.teamSlug))
      .limit(1);

    if (!team) continue;

    const members = await db
      .select({
        email: hackers.email,
      })
      .from(hackerProfiles)
      .innerJoin(hackers, eq(hackerProfiles.hackerId, hackers.id))
      .where(eq(hackerProfiles.teamId, team.id));

    const memberEmails = members.map((m) => m.email);

    const recentEmails = await db
      .select({
        sentAt: outboundEmails.sentAt,
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

    const uploadInfo = teamUploadMap.get(trackingTeam.teamSlug);
    const missing = uploadInfo?.missing || [];

    const shouldSendEmail = shouldSendReminder(lastEmailSentAt, now);
    const shouldSendDiscord = shouldSendEmail && missing.length > 0;

    console.log(`\n${team.slug}:`);
    console.log(
      `  Missing Files: ${missing.length > 0 ? missing.join(', ') : 'NONE'}`,
    );
    console.log(`  Should Send Email: ${shouldSendEmail ? '✅ YES' : '❌ NO'}`);
    console.log(
      `  Should Send Discord: ${shouldSendDiscord ? '✅ YES' : '❌ NO'}`,
    );

    if (shouldSendDiscord) {
      discordReminderTeams.push(team.slug);
    }

    if (shouldSendEmail && !shouldSendDiscord) {
      console.log(`  ⚠️  MISMATCH: Email YES but Discord NO`);
    }
  }

  console.log('\n\n📊 SUMMARY:');
  console.log('='.repeat(60));
  console.log(`Email Reminders: ${emailReminderTeams.length}`);
  if (emailReminderTeams.length > 0) {
    console.log(`  ${emailReminderTeams.join(', ')}`);
  }
  console.log(`\nDiscord Reminders: ${discordReminderTeams.length}`);
  if (discordReminderTeams.length > 0) {
    console.log(`  ${discordReminderTeams.join(', ')}`);
  }

  console.log(`\n${'='.repeat(60)}\n`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
