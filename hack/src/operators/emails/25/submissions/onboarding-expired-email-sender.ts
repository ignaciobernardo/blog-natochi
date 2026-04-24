import OnboardingExpiredEmail25 from '@/src/emails/submissions/onboarding-expired-25';
import { sendEmail } from '@/src/lib/email';
import { getSubmissionDetails } from '@/src/queries/submissions';

interface SendOnboardingExpiredEmail25Params {
  submissionId: string;
}

export class OnboardingExpiredEmailSender25 {
  async sendToAllMembers(
    params: SendOnboardingExpiredEmail25Params,
  ): Promise<void> {
    try {
      const submissionDetails = await getSubmissionDetails(params.submissionId);

      if (!submissionDetails) {
        console.error(
          `Failed to send onboarding expired emails: Submission ${params.submissionId} not found`,
        );
        return;
      }

      if (submissionDetails.members.length === 0) {
        console.error(
          `Failed to send onboarding expired emails: No members found for submission ${params.submissionId}`,
        );
        return;
      }

      const emailPromises = submissionDetails.members.map(async (member) => {
        await sendEmail({
          templateName: 'onboarding-expired',
          template: OnboardingExpiredEmail25,
          templateProps: {
            modality: submissionDetails.submission.modality,
          },
          to: member.email,
          subject: 'Onboarding expirado - Platanus Hack 25',
          sentByUserId: null,
        });
      });

      await Promise.all(emailPromises);
      console.log(
        `✅ Onboarding expired emails queued for ${submissionDetails.members.length} team members`,
      );
    } catch (error) {
      console.error('Failed to send onboarding expired emails:', error);
    }
  }
}

export const onboardingExpiredEmailSender25 =
  new OnboardingExpiredEmailSender25();
