import { eq, isNotNull } from 'drizzle-orm';
import FeedbackRequestEmail from '@/src/emails/feedback/feedback-request';
import { db } from '@/src/lib/db';
import { hackerProfiles, hackers, outboundEmails } from '@/src/lib/db/schema';
import { sendEmail } from '@/src/lib/email';

const TEMPLATE_NAME = 'feedback-request';

export async function sendFeedbackEmails() {
  console.log(
    '[JOB] 📝 Sending feedback request emails to eligible hackers...',
  );

  // Find hackers with a teamId set (meaning they attended the event)
  const eligibleHackers = await db
    .select({
      hackerId: hackers.id,
      publicId: hackers.publicId,
      email: hackers.email,
      fullName: hackers.fullName,
      teamId: hackerProfiles.teamId,
    })
    .from(hackerProfiles)
    .innerJoin(hackers, eq(hackerProfiles.hackerId, hackers.id))
    .where(isNotNull(hackerProfiles.teamId));

  console.log(
    `[JOB] 📝 Found ${eligibleHackers.length} hackers with team assignments (attended event)`,
  );

  if (eligibleHackers.length === 0) {
    console.log('[JOB] 📝 No eligible hackers found');
    return;
  }

  // Get all emails that have already been sent/queued with this template
  const sentFeedbackEmails = await db
    .select({
      to: outboundEmails.to,
    })
    .from(outboundEmails)
    .where(eq(outboundEmails.templateName, TEMPLATE_NAME));

  console.log(
    `[JOB] 📝 Found ${sentFeedbackEmails.length} feedback request emails already sent/queued`,
  );

  // Create a set of emails that have already received the feedback request
  const emailsAlreadySent = new Set(
    sentFeedbackEmails.map((email) => email.to.toLowerCase()),
  );

  // Filter hackers who haven't received the email
  const hackersToEmail = eligibleHackers.filter(
    (hacker) => !emailsAlreadySent.has(hacker.email.toLowerCase()),
  );

  console.log(
    `[JOB] 📝 Hackers who need feedback request email: ${hackersToEmail.length}`,
  );

  if (hackersToEmail.length === 0) {
    console.log(
      '[JOB] 📝 All eligible hackers have already received the feedback request email!',
    );
    return;
  }

  let successCount = 0;
  let errorCount = 0;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://hack.platan.us';

  for (const hacker of hackersToEmail) {
    try {
      const feedbackUrl = `${appUrl}/hacker/${hacker.publicId}/hack-25/feedback`;

      console.log(
        `[JOB] 📝 Sending feedback request email to ${hacker.fullName} (${hacker.email})...`,
      );

      await sendEmail({
        templateName: TEMPLATE_NAME,
        template: FeedbackRequestEmail,
        templateProps: {
          hackerName: hacker.fullName,
          feedbackUrl,
        },
        to: hacker.email,
        subject: 'Qué te pareció la hack? | Gana 50 USD hasta el jueves',
        sentByUserId: null,
      });

      successCount++;
    } catch (error) {
      console.error(
        `[JOB] 📝 Error sending to ${hacker.fullName} (${hacker.email}):`,
        error,
      );
      errorCount++;
    }
  }

  console.log(
    `[JOB] 📝 Feedback request emails: ${successCount} queued, ${errorCount} failed`,
  );
}
