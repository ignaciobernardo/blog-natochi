import OnboardingExpiredEmail26Ar from '@/src/emails/submissions/onboarding-expired-26-ar';
import { sendEmail } from '@/src/lib/email';
import { getSubmissionDetails } from '@/src/queries/submissions';

interface SendOnboardingExpiredEmail26ArParams {
  submissionId: string;
}

export class OnboardingExpiredEmailSender26Ar {
  async sendToAllMembers(
    params: SendOnboardingExpiredEmail26ArParams,
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
          template: OnboardingExpiredEmail26Ar,
          templateProps: {
            modality: submissionDetails.submission.modality,
          },
          to: member.email,
          subject: 'Onboarding expirado - Platanus Hack 26: Buenos Aires',
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

export const onboardingExpiredEmailSender26Ar =
  new OnboardingExpiredEmailSender26Ar();
