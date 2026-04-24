import { and, eq, inArray, isNotNull, or } from 'drizzle-orm';
import WelcomeEmail from '@/src/emails/submissions/welcome';
import { db } from '@/src/lib/db';
import {
  hackerProfiles,
  hackers,
  outboundEmails,
  submissions,
} from '@/src/lib/db/schema';
import { sendEmail } from '@/src/lib/email';

export async function sendWelcomeEmails() {
  console.log('[JOB] 🎉 Sending welcome emails to eligible hackers...');

  // Find submissions with status 'onboarding_request' or 'onboarding_complete'
  const eligibleSubmissions = await db
    .select({
      id: submissions.id,
      status: submissions.status,
    })
    .from(submissions)
    .where(
      or(
        eq(submissions.status, 'onboarding_request'),
        eq(submissions.status, 'onboarding_complete'),
      ),
    );

  console.log(
    `[JOB] 🎉 Found ${eligibleSubmissions.length} submissions with onboarding_request or onboarding_complete status`,
  );

  if (eligibleSubmissions.length === 0) {
    console.log('[JOB] 🎉 No submissions to process');
    return;
  }

  const submissionIds = eligibleSubmissions.map((s) => s.id);

  // Get all hackers from these submissions
  const hackersInSubmissions = await db
    .select({
      hackerId: hackers.id,
      email: hackers.email,
      fullName: hackers.fullName,
      submissionId: hackerProfiles.submissionId,
    })
    .from(hackerProfiles)
    .innerJoin(hackers, eq(hackerProfiles.hackerId, hackers.id))
    .where(
      and(
        inArray(hackerProfiles.submissionId, submissionIds),
        isNotNull(hackerProfiles.onboardCompleteAt),
      ),
    );

  console.log(
    `[JOB] 🎉 Total hackers in these submissions: ${hackersInSubmissions.length}`,
  );

  // Get all emails that have already been sent with template 'welcome'
  const sentWelcomeEmails = await db
    .select({
      to: outboundEmails.to,
      templateName: outboundEmails.templateName,
      status: outboundEmails.status,
    })
    .from(outboundEmails)
    .where(eq(outboundEmails.templateName, 'welcome'));

  console.log(
    `[JOB] 🎉 Found ${sentWelcomeEmails.length} welcome emails already sent/queued`,
  );

  // Create a set of emails that have already received the welcome email
  const emailsAlreadySent = new Set(
    sentWelcomeEmails.map((email) => email.to.toLowerCase()),
  );

  // Filter hackers who haven't received the email
  const hackersToEmail = hackersInSubmissions.filter(
    (hacker) => !emailsAlreadySent.has(hacker.email.toLowerCase()),
  );

  console.log(
    `[JOB] 🎉 Hackers who need welcome email: ${hackersToEmail.length}`,
  );

  if (hackersToEmail.length === 0) {
    console.log(
      '[JOB] 🎉 All eligible hackers have already received the welcome email!',
    );
    return;
  }

  let successCount = 0;
  let errorCount = 0;

  // Send emails individually to each hacker who completed onboarding
  for (const hacker of hackersToEmail) {
    try {
      console.log(
        `[JOB] 🎉 Sending welcome email to ${hacker.fullName} (${hacker.email})...`,
      );

      await sendEmail({
        templateName: 'welcome',
        template: WelcomeEmail,
        templateProps: {
          hackerName: hacker.fullName,
        },
        to: hacker.email,
        subject: 'Nos vemos mañana a las 18:30 - Platanus Hack 25 🍌',
        sentByUserId: null,
      });

      successCount++;
    } catch (error) {
      console.error(
        `[JOB] 🎉 Error sending to ${hacker.fullName} (${hacker.email}):`,
        error,
      );
      errorCount++;
    }
  }

  console.log(
    `[JOB] 🎉 Welcome emails sent: ${successCount} queued, ${errorCount} failed`,
  );
}
