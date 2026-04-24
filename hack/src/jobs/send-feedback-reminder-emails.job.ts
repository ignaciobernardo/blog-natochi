import { toZonedTime } from 'date-fns-tz';
import { eq, isNotNull } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import {
  hackerFeedback,
  hackerProfiles,
  hackers,
  outboundEmails,
} from '@/src/lib/db/schema';
import { CHILE_TIMEZONE } from '@/src/lib/utils/timezone';
import { feedbackReminderSender } from '@/src/operators/emails/feedback/feedback-reminder-sender';

const TEMPLATE_NAME = 'feedback-reminder';
const FEEDBACK_DEADLINE = new Date('2026-02-06T23:59:59-03:00');

function calculateDaysRemaining(): number {
  const now = new Date();
  const nowInChile = toZonedTime(now, CHILE_TIMEZONE);
  const deadlineInChile = toZonedTime(FEEDBACK_DEADLINE, CHILE_TIMEZONE);

  const startOfToday = new Date(
    nowInChile.getFullYear(),
    nowInChile.getMonth(),
    nowInChile.getDate(),
  );
  const startOfDeadlineDay = new Date(
    deadlineInChile.getFullYear(),
    deadlineInChile.getMonth(),
    deadlineInChile.getDate(),
  );

  const msPerDay = 24 * 60 * 60 * 1000;
  const daysDiff = Math.floor(
    (startOfDeadlineDay.getTime() - startOfToday.getTime()) / msPerDay,
  );

  return daysDiff;
}

export async function sendFeedbackReminderEmails(): Promise<undefined> {
  console.log(
    '[CRON] 📝 Checking if feedback reminder emails should be sent...',
  );

  const now = new Date();
  if (now > FEEDBACK_DEADLINE) {
    console.log(
      '[CRON] 📝 Feedback deadline has passed, skipping reminder emails',
    );
    return undefined;
  }

  const daysRemaining = calculateDaysRemaining();
  console.log(
    `[CRON] 📝 Days remaining until feedback deadline: ${daysRemaining}`,
  );

  if (daysRemaining < 0) {
    console.log('[CRON] 📝 Deadline day has passed, skipping reminder emails');
    return undefined;
  }

  const hackerProfilesWithFeedback = await db
    .select({ hackerProfileId: hackerFeedback.hackerProfileId })
    .from(hackerFeedback);

  const hackerProfileIdsWithFeedback = hackerProfilesWithFeedback.map(
    (f) => f.hackerProfileId,
  );

  console.log(
    `[CRON] 📝 Found ${hackerProfileIdsWithFeedback.length} hackers who have already submitted feedback`,
  );

  const allHackersWithTeam = await db
    .select({
      hackerId: hackers.id,
      publicId: hackers.publicId,
      email: hackers.email,
      fullName: hackers.fullName,
      teamId: hackerProfiles.teamId,
      hackerProfileId: hackerProfiles.id,
    })
    .from(hackerProfiles)
    .innerJoin(hackers, eq(hackerProfiles.hackerId, hackers.id))
    .where(isNotNull(hackerProfiles.teamId));

  const eligibleHackers = allHackersWithTeam.filter(
    (hacker) => !hackerProfileIdsWithFeedback.includes(hacker.hackerProfileId),
  );

  console.log(
    `[CRON] 📝 Found ${allHackersWithTeam.length} hackers with team assignments`,
  );
  console.log(
    `[CRON] 📝 Found ${eligibleHackers.length} hackers who haven't submitted feedback yet`,
  );

  if (eligibleHackers.length === 0) {
    console.log(
      '[CRON] 📝 No eligible hackers found (all have submitted feedback)',
    );
    return undefined;
  }

  const todayDateStr = new Date().toISOString().split('T')[0];
  const templateNameForToday = `${TEMPLATE_NAME}-${todayDateStr}`;

  const sentReminderEmails = await db
    .select({
      to: outboundEmails.to,
    })
    .from(outboundEmails)
    .where(eq(outboundEmails.templateName, templateNameForToday));

  console.log(
    `[CRON] 📝 Found ${sentReminderEmails.length} reminder emails already sent today`,
  );

  const emailsAlreadySentToday = new Set(
    sentReminderEmails.map((email) => email.to.toLowerCase()),
  );

  const hackersToEmail = eligibleHackers.filter(
    (hacker) => !emailsAlreadySentToday.has(hacker.email.toLowerCase()),
  );

  console.log(
    `[CRON] 📝 Hackers who need reminder email today: ${hackersToEmail.length}`,
  );

  if (hackersToEmail.length === 0) {
    console.log(
      '[CRON] 📝 All eligible hackers have already received reminder email today!',
    );
    return undefined;
  }

  let successCount = 0;
  let errorCount = 0;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://hack.platan.us';

  for (const hacker of hackersToEmail) {
    try {
      await feedbackReminderSender.sendToHacker({
        hackerEmail: hacker.email,
        hackerName: hacker.fullName,
        feedbackUrl: `${appUrl}/hacker/${hacker.publicId}/hack-25/feedback`,
        daysRemaining,
        templateName: templateNameForToday,
      });
      successCount++;
    } catch (error) {
      console.error(
        `[CRON] 📝 Error sending to ${hacker.fullName} (${hacker.email}):`,
        error,
      );
      errorCount++;
    }
  }

  console.log(
    `[CRON] 📝 Feedback reminder emails: ${successCount} queued, ${errorCount} failed`,
  );

  return undefined;
}
