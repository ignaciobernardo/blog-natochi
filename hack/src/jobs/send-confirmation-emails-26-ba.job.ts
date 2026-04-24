import { and, eq, ilike, inArray, ne } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import {
  events,
  hackerProfiles,
  hackers,
  outboundEmails,
  submissions,
} from '@/src/lib/db/schema';
import { confirmationSubmissionEmailSender26Ar } from '@/src/operators/emails/26-ar/submissions/confirmation-submission-email-sender';

const EVENT_SLUG = '26-ar';
const TEMPLATE_NAME = 'confirmation-submission';

export async function sendConfirmationEmails26Ba() {
  console.log(
    `[JOB] ✉️ Sending confirmation emails for submissions in event ${EVENT_SLUG}...`,
  );

  const receivedSubmissions = await db
    .select({
      submissionId: submissions.id,
    })
    .from(submissions)
    .innerJoin(events, eq(submissions.eventId, events.id))
    .where(
      and(eq(events.slug, EVENT_SLUG), eq(submissions.status, 'received')),
    );

  if (receivedSubmissions.length === 0) {
    console.log(
      `[JOB] ✉️ No submissions in "received" status found for ${EVENT_SLUG}`,
    );
    return;
  }

  console.log(
    `[JOB] ✉️ Found ${receivedSubmissions.length} submissions in "received" status for ${EVENT_SLUG}`,
  );

  const submissionIds = receivedSubmissions.map(
    (submission) => submission.submissionId,
  );

  const hackersInSubmissions = await db
    .select({
      submissionId: hackerProfiles.submissionId,
      email: hackers.email,
    })
    .from(hackerProfiles)
    .innerJoin(hackers, eq(hackerProfiles.hackerId, hackers.id))
    .where(inArray(hackerProfiles.submissionId, submissionIds));

  if (hackersInSubmissions.length === 0) {
    console.log('[JOB] ✉️ No hackers found in matching submissions');
    return;
  }

  console.log(
    `[JOB] ✉️ Found ${hackersInSubmissions.length} hackers in matching submissions`,
  );

  const recipientEmails = hackersInSubmissions.map((hacker) => hacker.email);

  const alreadyProcessedConfirmationEmails = await db
    .select({
      to: outboundEmails.to,
      status: outboundEmails.status,
    })
    .from(outboundEmails)
    .where(
      and(
        eq(outboundEmails.templateName, TEMPLATE_NAME),
        inArray(outboundEmails.to, recipientEmails),
        ilike(outboundEmails.subject, '%Platanus Hack 26: Buenos Aires%'),
        ne(outboundEmails.status, 'failed'),
      ),
    );

  const emailsAlreadyProcessed = new Set(
    alreadyProcessedConfirmationEmails.map((email) => email.to.toLowerCase()),
  );

  const hackersToEmail = hackersInSubmissions.filter(
    (hacker) => !emailsAlreadyProcessed.has(hacker.email.toLowerCase()),
  );

  if (hackersToEmail.length === 0) {
    console.log(
      '[JOB] ✉️ All hackers in received submissions already have confirmation emails queued/sent',
    );
    return;
  }

  console.log(
    `[JOB] ✉️ Hackers missing confirmation email: ${hackersToEmail.length}`,
  );

  const recipientsBySubmissionId = new Map<string, string[]>();
  for (const hacker of hackersToEmail) {
    const currentRecipients =
      recipientsBySubmissionId.get(hacker.submissionId) || [];
    currentRecipients.push(hacker.email);
    recipientsBySubmissionId.set(hacker.submissionId, currentRecipients);
  }

  let queuedCount = 0;

  for (const [submissionId, submissionRecipients] of recipientsBySubmissionId) {
    await confirmationSubmissionEmailSender26Ar.sendToAllMembers({
      submissionId,
      sentByUserId: null,
      recipientEmails: submissionRecipients,
    });

    queuedCount += submissionRecipients.length;
  }

  console.log(
    `[JOB] ✉️ Confirmation emails queued for ${queuedCount} hackers in ${EVENT_SLUG}`,
  );
}
