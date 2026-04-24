import OnboardingCompleteEmail25 from '@/src/emails/submissions/onboarding-complete-25';
import { sendEmail } from '@/src/lib/email';
import { generatePlatanusHack25ICS } from '@/src/lib/utils/ics';
import { getHackerById } from '@/src/queries/hackers';

interface SendOnboardingCompleteEmail25Params {
  hackerId: string;
  hackerEmail: string;
}

export class OnboardingCompleteEmailSender25 {
  async sendToHacker(
    params: SendOnboardingCompleteEmail25Params,
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
        template: OnboardingCompleteEmail25,
        templateProps: {
          hackerName: hacker.fullName,
          hackerGender: hacker.gender,
        },
        to: params.hackerEmail,
        subject: 'Todo listo para Platanus Hack 25 🎉',
        sentByUserId: null,
        attachments: [
          {
            filename: 'Platanus-Hack-25.ics',
            content: generatePlatanusHack25ICS(),
            contentType: 'text/calendar',
          },
        ],
      });

      console.log(
        `✅ Onboarding complete email queued for hacker ${params.hackerId}`,
      );
    } catch (error) {
      console.error('Failed to send onboarding complete email:', error);
    }
  }
}

export const onboardingCompleteEmailSender25 =
  new OnboardingCompleteEmailSender25();
