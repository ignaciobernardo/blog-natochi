import OnboardingReminderEmail25 from '@/src/emails/submissions/onboarding-reminder-25';
import { sendEmail } from '@/src/lib/email';
import {
  getLatestStatusChange,
  getSubmissionDetails,
  hasEmailBeenSentToAddress,
} from '@/src/queries/submissions';

interface SendOnboardingReminderEmail25Params {
  submissionId: string;
  hoursRemaining: number;
}

function formatDeadline(date: Date): string {
  return date.toLocaleString('es-CL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Santiago',
  });
}

export class OnboardingReminderEmailSender25 {
  async sendToAllMembers(
    params: SendOnboardingReminderEmail25Params,
  ): Promise<void> {
    try {
      const submissionDetails = await getSubmissionDetails(params.submissionId);

      if (!submissionDetails) {
        console.error(
          `Failed to send onboarding reminder emails: Submission ${params.submissionId} not found`,
        );
        return;
      }

      if (submissionDetails.members.length === 0) {
        console.error(
          `Failed to send onboarding reminder emails: No members found for submission ${params.submissionId}`,
        );
        return;
      }

      const latestStatusChange = await getLatestStatusChange(
        params.submissionId,
      );
      if (!latestStatusChange) {
        console.error(
          `Failed to send onboarding reminder emails: No status change found for submission ${params.submissionId}`,
        );
        return;
      }

      const deadline = new Date(latestStatusChange.changedAt);
      deadline.setHours(deadline.getHours() + 39);
      const formattedDeadline = formatDeadline(deadline);

      let emailsSent = 0;
      let emailsSkipped = 0;
      const templateName = `onboarding-reminder-${params.hoursRemaining}h`;

      for (const member of submissionDetails.members) {
        if (member.profile?.onboardCompleteAt) {
          emailsSkipped++;
          continue;
        }

        const alreadySent = await hasEmailBeenSentToAddress(
          member.email,
          templateName,
        );

        if (alreadySent) {
          emailsSkipped++;
          continue;
        }

        await sendEmail({
          templateName,
          template: OnboardingReminderEmail25,
          templateProps: {
            hackerPublicId: member.publicId,
            modality: submissionDetails.submission.modality,
            deadline: formattedDeadline,
            hoursRemaining: params.hoursRemaining,
          },
          to: member.email,
          subject: `Recordatorio: ${params.hoursRemaining}h para completar onboarding`,
          sentByUserId: null,
        });

        emailsSent++;
      }

      console.log(
        `✅ Onboarding ${params.hoursRemaining}h reminder emails queued: ${emailsSent} sent, ${emailsSkipped} skipped (already sent)`,
      );
    } catch (error) {
      console.error('Failed to send onboarding reminder emails:', error);
    }
  }
}

export const onboardingReminderEmailSender25 =
  new OnboardingReminderEmailSender25();
