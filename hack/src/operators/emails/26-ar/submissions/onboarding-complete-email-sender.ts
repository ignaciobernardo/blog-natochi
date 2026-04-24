import OnboardingCompleteEmail26Ar from '@/src/emails/submissions/onboarding-complete-26-ar';
import { sendEmail } from '@/src/lib/email';
import { getHackerById } from '@/src/queries/hackers';

interface SendOnboardingCompleteEmail26ArParams {
  hackerId: string;
  hackerEmail: string;
}

export class OnboardingCompleteEmailSender26Ar {
  async sendToHacker(
    params: SendOnboardingCompleteEmail26ArParams,
  ): Promise<void> {
    try {
      const hacker = await getHackerById(params.hackerId);

      if (!hacker) {
        console.error(
          `Failed to send onboarding complete email: Hacker ${params.hackerId} not found`,
        );
        return;
      }

      await sendEmail({
        templateName: 'onboarding-complete',
        template: OnboardingCompleteEmail26Ar,
        templateProps: {
          hackerName: hacker.fullName,
          hackerGender: hacker.gender,
        },
        to: params.hackerEmail,
        subject: 'Todo listo para Platanus Hack 26: Buenos Aires 🎉',
        sentByUserId: null,
      });

      console.log(
        `✅ Onboarding complete email queued for hacker ${params.hackerId}`,
      );
    } catch (error) {
      console.error('Failed to send onboarding complete email:', error);
    }
  }
}

export const onboardingCompleteEmailSender26Ar =
  new OnboardingCompleteEmailSender26Ar();
