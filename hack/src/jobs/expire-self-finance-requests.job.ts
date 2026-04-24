import { getSelfFinanceExpiredEmailSender } from '@/src/operators/emails/submissions/by-event';
import { selfFinanceExpiredNotifier } from '@/src/operators/slack/self-finance-expired-notifier';
import {
  getStatusChangeForSubmission,
  getSubmissionDetails,
  getSubmissionsInStatus,
  updateSubmissionStatus,
} from '@/src/queries/submissions';

export async function expireSelfFinanceRequests() {
  console.log('[CRON] ⏰ Checking for expired self-finance requests...');

  // Find all submissions in asking_self_finance_trip status
  const askingSubmissions = await getSubmissionsInStatus(
    'asking_self_finance_trip',
  );

  if (askingSubmissions.length === 0) {
    console.log('[CRON] ⏰ No submissions in asking_self_finance_trip status');
    return;
  }

  console.log(
    `[CRON] ⏰ Found ${askingSubmissions.length} submissions in asking_self_finance_trip status`,
  );

  let expiredCount = 0;

  for (const submission of askingSubmissions) {
    try {
      // Get the status change timestamp when it was moved to asking_self_finance_trip
      const latestStatusChange = await getStatusChangeForSubmission(
        submission.id,
        'asking_self_finance_trip',
      );

      if (!latestStatusChange) {
        console.log(
          `[CRON] ⏰ No status change found for submission ${submission.id}`,
        );
        continue;
      }

      // Calculate deadline (48 hours from status change)
      const deadline = new Date(latestStatusChange.changedAt);
      deadline.setHours(deadline.getHours() + 48);

      const now = new Date();

      // Check if deadline has passed
      if (now > deadline) {
        console.log(
          `[CRON] ⏰ Submission ${submission.id} has expired (deadline: ${deadline.toISOString()})`,
        );

        // Update status to rejected
        await updateSubmissionStatus(submission.id, 'rejected', null, {
          action: 'auto_expire_self_finance_trip',
          expiredAt: now.toISOString(),
        });

        // Get submission details for notifications
        const submissionDetails = await getSubmissionDetails(submission.id);

        if (submissionDetails) {
          // Send expiration emails to all members
          await getSelfFinanceExpiredEmailSender(
            submissionDetails.event.slug,
          ).sendToAllMembers({
            submissionId: submission.id,
          });

          // Send Slack notification
          await selfFinanceExpiredNotifier.notifyExpired({
            submissionId: submission.id,
          });
        }

        expiredCount++;
      }
    } catch (error) {
      console.error(
        `[CRON] ⏰ Error processing submission ${submission.id}:`,
        error,
      );
    }
  }

  if (expiredCount > 0) {
    console.log(
      `[CRON] ⏰ Expired ${expiredCount} self-finance requests and sent notifications`,
    );
  } else {
    console.log('[CRON] ⏰ No expired self-finance requests found');
  }
}
