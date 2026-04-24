import { and, eq, inArray, isNotNull } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import {
  hackerProfiles,
  hackers,
  outboundEmails,
  submissions,
} from '@/src/lib/db/schema';
import { getWelcomeEmailSender } from '@/src/operators/emails/submissions/by-event';
import { getSubmissionDetails } from '@/src/queries/submissions';

async function sendWelcomeEmails() {
  console.log('🔍 Finding hackers who need welcome emails...\n');

  // Find submissions with status 'onboarding_complete'
  const eligibleSubmissions = await db
    .select({
      id: submissions.id,
      status: submissions.status,
    })
    .from(submissions)
    .where(eq(submissions.status, 'onboarding_complete'));

  console.log(
    `📊 Found ${eligibleSubmissions.length} submissions with onboarding_complete status\n`,
  );

  if (eligibleSubmissions.length === 0) {
    console.log('✅ No submissions to process');
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
    `👥 Total hackers in these submissions: ${hackersInSubmissions.length}\n`,
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
    `📧 Found ${sentWelcomeEmails.length} welcome emails already sent/queued\n`,
  );

  // Create a set of emails that have already received the welcome email
  const emailsAlreadySent = new Set(
    sentWelcomeEmails.map((email) => email.to.toLowerCase()),
  );

  // Filter hackers who haven't received the email
  const hackersToEmail = hackersInSubmissions.filter(
    (hacker) => !emailsAlreadySent.has(hacker.email.toLowerCase()),
  );

  console.log(`🎯 Hackers who need welcome email: ${hackersToEmail.length}\n`);

  if (hackersToEmail.length === 0) {
    console.log(
      '✅ All eligible hackers have already received the welcome email!',
    );
    return;
  }

  // Group hackers by submission ID
  const hackersBySubmission = new Map<string, typeof hackersToEmail>();
  for (const hacker of hackersToEmail) {
    const submissionHackers =
      hackersBySubmission.get(hacker.submissionId) || [];
    submissionHackers.push(hacker);
    hackersBySubmission.set(hacker.submissionId, submissionHackers);
  }

  console.log('📤 Sending welcome emails...\n');

  let successCount = 0;
  let errorCount = 0;

  // Send emails for each submission
  for (const [submissionId, _hackers] of hackersBySubmission.entries()) {
    try {
      console.log(
        `   Sending to ${_hackers.length} hacker(s) in submission ${submissionId.slice(0, 8)}...`,
      );
      const submissionDetails = await getSubmissionDetails(submissionId);
      if (!submissionDetails) {
        throw new Error(`Submission ${submissionId} not found`);
      }

      await getWelcomeEmailSender(
        submissionDetails.event.slug,
      ).sendToAllMembers({
        submissionId,
        sentByUserId: null,
      });
      successCount += _hackers.length;
    } catch (error) {
      console.error(
        `   ❌ Error sending to submission ${submissionId.slice(0, 8)}:`,
        error,
      );
      errorCount += _hackers.length;
    }
  }

  console.log('\n📊 Summary:');
  console.log(`   ✅ Successfully queued: ${successCount} emails`);
  if (errorCount > 0) {
    console.log(`   ❌ Failed: ${errorCount} emails`);
  }
  console.log('\n✅ Done!');
}

sendWelcomeEmails()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
