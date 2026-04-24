import { getOnboardingExpiredEmailSender } from '@/src/operators/emails/submissions/by-event';
import {
  getStatusChangeForSubmission,
  getSubmissionDetails,
  getSubmissionsInStatus,
  updateSubmissionStatus,
} from '@/src/queries/submissions';

export async function expireOnboardingRequests() {
  console.log('[CRON] ⏰ Checking for expired onboarding requests...');

  const onboardingSubmissions =
    await getSubmissionsInStatus('onboarding_request');

  if (onboardingSubmissions.length === 0) {
    console.log('[CRON] ⏰ No submissions in onboarding_request status');
    return;
  }

  console.log(
    `[CRON] ⏰ Found ${onboardingSubmissions.length} submissions in onboarding_request status`,
  );

  let expiredCount = 0;

  for (const submission of onboardingSubmissions) {
    try {
      const latestStatusChange = await getStatusChangeForSubmission(
        submission.id,
        'onboarding_request',
      );

      if (!latestStatusChange) {
        console.log(
          `[CRON] ⏰ No status change found for submission ${submission.id}`,
        );
        continue;
      }

      const deadline = new Date(latestStatusChange.changedAt);
      deadline.setHours(deadline.getHours() + 39);

      const now = new Date();

      if (now > deadline) {
        console.log(
          `[CRON] ⏰ Submission ${submission.id} has expired (deadline: ${deadline.toISOString()})`,
        );

        await updateSubmissionStatus(
          submission.id,
          'onboarding_expired',
          null,
          {
            action: 'auto_expire_onboarding',
            expiredAt: now.toISOString(),
          },
        );

        const submissionDetails = await getSubmissionDetails(submission.id);

        if (submissionDetails) {
          await getOnboardingExpiredEmailSender(
            submissionDetails.event.slug,
          ).sendToAllMembers({
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
      `[CRON] ⏰ Expired ${expiredCount} onboarding requests and sent notifications`,
    );
  } else {
    console.log('[CRON] ⏰ No expired onboarding requests found');
  }
}
