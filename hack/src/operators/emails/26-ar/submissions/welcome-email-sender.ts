import WelcomeEmail26Ar from '@/src/emails/submissions/welcome-26-ar';
import { sendEmail } from '@/src/lib/email';
import { getSubmissionDetails } from '@/src/queries/submissions';

interface SendWelcomeEmail26ArParams {
  submissionId: string;
  sentByUserId: string | null;
}

export class WelcomeEmailSender26Ar {
  async sendToAllMembers(params: SendWelcomeEmail26ArParams): Promise<void> {
    try {
      const submissionDetails = await getSubmissionDetails(params.submissionId);
      if (!submissionDetails || submissionDetails.members.length === 0) return;

      await Promise.all(
        submissionDetails.members.map((member) =>
          sendEmail({
            templateName: 'welcome',
            template: WelcomeEmail26Ar,
            templateProps: {
              hackerName: member.fullName,
            },
            to: member.email,
            subject: 'Nos vemos mañana - Platanus Hack 26: Buenos Aires 🍌',
            sentByUserId: params.sentByUserId,
          }),
        ),
      );
    } catch (error) {
      console.error('Failed to send welcome emails:', error);
    }
  }
}

export const welcomeEmailSender26Ar = new WelcomeEmailSender26Ar();
