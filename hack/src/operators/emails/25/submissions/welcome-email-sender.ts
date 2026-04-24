import WelcomeEmail25 from '@/src/emails/submissions/welcome-25';
import { sendEmail } from '@/src/lib/email';
import { getSubmissionDetails } from '@/src/queries/submissions';

interface SendWelcomeEmail25Params {
  submissionId: string;
  sentByUserId: string | null;
}

export class WelcomeEmailSender25 {
  async sendToAllMembers(params: SendWelcomeEmail25Params): Promise<void> {
    try {
      const submissionDetails = await getSubmissionDetails(params.submissionId);
      if (!submissionDetails || submissionDetails.members.length === 0) return;

      await Promise.all(
        submissionDetails.members.map((member) =>
          sendEmail({
            templateName: 'welcome',
            template: WelcomeEmail25,
            templateProps: {
              hackerName: member.fullName,
            },
            to: member.email,
            subject: 'Nos vemos mañana a las 18:30 - Platanus Hack 25 🍌',
            sentByUserId: params.sentByUserId,
          }),
        ),
      );
    } catch (error) {
      console.error('Failed to send welcome emails:', error);
    }
  }
}

export const welcomeEmailSender25 = new WelcomeEmailSender25();
