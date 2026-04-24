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

const TEAMS_TO_CHECK = ['team-13', 'team-15'];
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

  if (
    new Date(
      lastEmailSentAt.getTime() +
        lastEmailSentAt.getTimezoneOffset() * 60000 +
        CHILE_TIMEZONE_OFFSET * 60000,
    ).getDate() === 26
  ) {
    return isAfter10amNov27(now);
  }

  const hoursSinceLastEmail =
    (now.getTime() - lastEmailSentAt.getTime()) / (1000 * 60 * 60);

  return hoursSinceLastEmail >= 24;
}

async function inspectTeam(teamSlug: string) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Inspecting: ${teamSlug}`);
  console.log(`${'='.repeat(60)}\n`);

  const now = new Date();

  // 1. Check Google Sheets data
  const trackingData = await googleSheetsService.getTeamUploadTracking();
  const sheetTeam = trackingData.find((t) => t.teamSlug === teamSlug);

  console.log('📊 SPREADSHEET DATA:');
  if (sheetTeam) {
    console.log(`  Slides Updated At: ${sheetTeam.slidesUpdatedAt || 'EMPTY'}`);
    console.log(`  Demo Updated At: ${sheetTeam.demoUpdatedAt || 'EMPTY'}`);
    console.log(
      `  Upload Folder URL: ${sheetTeam.uploadFolderUrl ? 'EXISTS' : 'MISSING'}`,
    );
  } else {
    console.log('  NOT FOUND IN SPREADSHEET');
  }

  // 2. Check database
  const [dbTeam] = await db
    .select({ id: teams.id, slug: teams.slug })
    .from(teams)
    .where(eq(teams.slug, teamSlug))
    .limit(1);

  console.log('\n🗄️  DATABASE TEAM:');
  if (!dbTeam) {
    console.log('  NOT FOUND IN DATABASE');
    return;
  }
  console.log(`  ID: ${dbTeam.id}`);

  // 3. Check presentation uploads
  const [upload] = await db
    .select({
      slidesUploadedAt: presentationUploads.slidesUploadedAt,
      demoUploadedAt: presentationUploads.demoUploadedAt,
    })
    .from(presentationUploads)
    .where(eq(presentationUploads.teamId, dbTeam.id))
    .limit(1);

  console.log('\n📤 PRESENTATION UPLOADS:');
  if (upload) {
    console.log(`  Slides Uploaded At: ${upload.slidesUploadedAt || 'NULL'}`);
    console.log(`  Demo Uploaded At: ${upload.demoUploadedAt || 'NULL'}`);
    console.log(
      `  Missing: ${
        [
          !upload.slidesUploadedAt ? 'slides' : null,
          !upload.demoUploadedAt ? 'demo' : null,
        ]
          .filter(Boolean)
          .join(', ') || 'NONE (all uploaded)'
      }`,
    );
  } else {
    console.log('  NO RECORD FOUND');
  }

  // 4. Check team members
  const members = await db
    .select({
      email: hackers.email,
      fullName: hackers.fullName,
    })
    .from(hackerProfiles)
    .innerJoin(hackers, eq(hackerProfiles.hackerId, hackers.id))
    .where(eq(hackerProfiles.teamId, dbTeam.id));

  console.log(`\n👥 TEAM MEMBERS: ${members.length}`);
  const memberEmails = members.map((m) => m.email);

  // 5. Check recent emails
  const recentEmails = await db
    .select({
      to: outboundEmails.to,
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

  console.log('\n📧 EMAIL REMINDER HISTORY:');
  console.log(`  Last Email Sent: ${lastEmailSentAt || 'NEVER'}`);
  console.log(
    `  Should Send Email Reminder: ${shouldSendReminder(lastEmailSentAt, now)}`,
  );

  // 6. Determine Discord status
  console.log('\n🤖 DISCORD NOTIFICATION STATUS:');
  const missing = upload
    ? [
        !upload.slidesUploadedAt ? 'slides' : null,
        !upload.demoUploadedAt ? 'demo' : null,
      ].filter(Boolean)
    : [];

  console.log(
    `  Missing Files: ${missing.length > 0 ? missing.join(', ') : 'NONE'}`,
  );
  console.log(
    `  Should Send Discord: ${
      shouldSendReminder(lastEmailSentAt, now) && missing.length > 0
        ? '✅ YES'
        : '❌ NO'
    }`,
  );

  if (shouldSendReminder(lastEmailSentAt, now) && missing.length === 0) {
    console.log(
      '  ⚠️  PROBLEM: Would send email reminder but has no missing files!',
    );
  }

  if (!shouldSendReminder(lastEmailSentAt, now) && missing.length > 0) {
    console.log(
      '  ⚠️  PROBLEM: Has missing files but no email reminder would be sent!',
    );
  }
}

async function main() {
  console.log('\n🔍 INSPECTING VIDEO UPLOAD REMINDERS\n');

  for (const teamSlug of TEAMS_TO_CHECK) {
    await inspectTeam(teamSlug);
  }

  console.log(`\n${'='.repeat(60)}\n`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
