import { getOnboardingReminderEmailSender } from '@/src/operators/emails/submissions/by-event';
import {
  getStatusChangeForSubmission,
  getSubmissionDetails,
  getSubmissionsInStatus,
} from '@/src/queries/submissions';

const REMINDER_HOURS = [24, 12, 3, 1];

export async function remindOnboardingRequests() {
  console.log(
    '[CRON] 📬 Checking for onboarding requests needing reminders...',
  );

  const onboardingSubmissions =
    await getSubmissionsInStatus('onboarding_request');

  if (onboardingSubmissions.length === 0) {
    console.log('[CRON] 📬 No submissions in onboarding_request status');
    return;
  }

  console.log(
    `[CRON] 📬 Found ${onboardingSubmissions.length} submissions in onboarding_request status`,
  );

  let reminderCount = 0;

  for (const submission of onboardingSubmissions) {
    try {
      const latestStatusChange = await getStatusChangeForSubmission(
        submission.id,
        'onboarding_request',
      );

      if (!latestStatusChange) {
        console.log(
          `[CRON] 📬 No status change found for submission ${submission.id}`,
        );
        continue;
      }

      const deadline = new Date(latestStatusChange.changedAt);
      deadline.setHours(deadline.getHours() + 39);

      const now = new Date();
      const _hoursUntilDeadline =
        (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (now > deadline) {
        continue;
      }

      for (const reminderHours of REMINDER_HOURS) {
        const reminderTime = new Date(deadline);
        reminderTime.setHours(reminderTime.getHours() - reminderHours);

        if (
          now >= reminderTime &&
          now < new Date(reminderTime.getTime() + 10 * 60 * 1000)
        ) {
          console.log(
            `[CRON] 📬 Sending ${reminderHours}h reminder for submission ${submission.id}`,
          );

          const submissionDetails = await getSubmissionDetails(submission.id);
          if (!submissionDetails) {
            break;
          }

          await getOnboardingReminderEmailSender(
            submissionDetails.event.slug,
          ).sendToAllMembers({
            submissionId: submission.id,
            hoursRemaining: reminderHours,
          });

          reminderCount++;
          break;
        }
      }
    } catch (error) {
      console.error(
        `[CRON] 📬 Error processing submission ${submission.id}:`,
        error,
      );
    }
  }

  if (reminderCount > 0) {
    console.log(`[CRON] 📬 Sent ${reminderCount} onboarding reminder(s)`);
  } else {
    console.log('[CRON] 📬 No reminders needed at this time');
  }
}
