import { getOnboardingRequestEmailSender } from '@/src/operators/emails/submissions/by-event';
import {
  getSubmissionDetails,
  getSubmissionsInStatus,
  updateSubmissionStatus,
} from '@/src/queries/submissions';

export async function requestOnboarding() {
  console.log('[JOB] 📝 Requesting onboarding for approved submissions...');

  const approvedSubmissions = await getSubmissionsInStatus('approved');

  if (approvedSubmissions.length === 0) {
    console.log('[JOB] 📝 No approved submissions found');
    return;
  }

  console.log(
    `[JOB] 📝 Found ${approvedSubmissions.length} approved submissions`,
  );

  let processedCount = 0;

  for (const submission of approvedSubmissions) {
    try {
      console.log(`[JOB] 📝 Processing submission ${submission.id}...`);

      await updateSubmissionStatus(submission.id, 'onboarding_request', null, {
        action: 'request_onboarding',
        requestedAt: new Date().toISOString(),
      });

      const submissionDetails = await getSubmissionDetails(submission.id);
      if (!submissionDetails) {
        continue;
      }

      await getOnboardingRequestEmailSender(
        submissionDetails.event.slug,
      ).sendToAllMembers({
        submissionId: submission.id,
        sentByUserId: null,
      });

      processedCount++;
    } catch (error) {
      console.error(
        `[JOB] 📝 Error processing submission ${submission.id}:`,
        error,
      );
    }
  }

  console.log(
    `[JOB] 📝 Requested onboarding for ${processedCount} submissions`,
  );
}
