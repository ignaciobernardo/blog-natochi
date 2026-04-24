import { getSelfFinanceReminderEmailSender } from '@/src/operators/emails/submissions/by-event';
import {
  getStatusChangeForSubmission,
  getSubmissionDetails,
  getSubmissionsInStatus,
} from '@/src/queries/submissions';

export async function remindSelfFinanceRequests() {
  console.log(
    '[CRON] 🔔 Checking for self-finance requests needing 24h reminder...',
  );

  // Find all submissions in asking_self_finance_trip status
  const askingSubmissions = await getSubmissionsInStatus(
    'asking_self_finance_trip',
  );

  if (askingSubmissions.length === 0) {
    console.log('[CRON] 🔔 No submissions in asking_self_finance_trip status');
    return;
  }

  console.log(
    `[CRON] 🔔 Found ${askingSubmissions.length} submissions in asking_self_finance_trip status`,
  );

  let reminderCount = 0;

  for (const submission of askingSubmissions) {
    try {
      // Get the status change timestamp when it was moved to asking_self_finance_trip
      const latestStatusChange = await getStatusChangeForSubmission(
        submission.id,
        'asking_self_finance_trip',
      );

      if (!latestStatusChange) {
        console.log(
          `[CRON] 🔔 No status change found for submission ${submission.id}`,
        );
        continue;
      }

      // Calculate 24-hour mark (24 hours from status change)
      const reminderTime = new Date(latestStatusChange.changedAt);
      reminderTime.setHours(reminderTime.getHours() + 24);

      const now = new Date();

      // Check if we've passed 24 hours but not 48 hours yet
      const deadline = new Date(latestStatusChange.changedAt);
      deadline.setHours(deadline.getHours() + 48);

      if (now > reminderTime && now < deadline) {
        console.log(
          `[CRON] 🔔 Processing 24h reminders for submission ${submission.id} (status changed: ${latestStatusChange.changedAt})`,
        );

        // Send reminder emails to all members (individual email checks happen inside)
        const submissionDetails = await getSubmissionDetails(submission.id);
        if (!submissionDetails) {
          continue;
        }

        await getSelfFinanceReminderEmailSender(
          submissionDetails.event.slug,
        ).sendToAllMembers({
          submissionId: submission.id,
        });

        reminderCount++;
      }
    } catch (error) {
      console.error(
        `[CRON] 🔔 Error processing submission ${submission.id}:`,
        error,
      );
    }
  }

  if (reminderCount > 0) {
    console.log(`[CRON] 🔔 Sent ${reminderCount} self-finance reminder(s)`);
  } else {
    console.log('[CRON] 🔔 No reminders needed at this time');
  }
}
