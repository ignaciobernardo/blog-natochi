import FeedbackReminderEmail from '@/src/emails/feedback/feedback-reminder';
import { sendEmail } from '@/src/lib/email';

interface SendFeedbackReminderParams {
  hackerEmail: string;
  hackerName: string;
  feedbackUrl: string;
  daysRemaining: number;
  templateName: string;
}

function getSubjectForDays(daysRemaining: number): string {
  if (daysRemaining <= 0) {
    return 'Último día para dar feedback y ganar hasta 50 USD';
  }
  if (daysRemaining === 1) {
    return 'Un día para dar feedback y ganar hasta 50 USD';
  }
  if (daysRemaining === 2) {
    return 'Dos días para dar feedback y ganar hasta 50 USD';
  }
  return `${daysRemaining} días para dar feedback y ganar hasta 50 USD`;
}

export class FeedbackReminderSender {
  async sendToHacker(params: SendFeedbackReminderParams): Promise<void> {
    const {
      hackerEmail,
      hackerName,
      feedbackUrl,
      daysRemaining,
      templateName,
    } = params;

    const subject = getSubjectForDays(daysRemaining);

    console.log(
      `📧 Sending feedback reminder email to ${hackerName} (${hackerEmail})`,
    );

    await sendEmail({
      templateName,
      template: FeedbackReminderEmail,
      templateProps: {
        hackerName,
        feedbackUrl,
        daysRemaining,
      },
      to: hackerEmail,
      subject,
      sentByUserId: null,
    });

    console.log(
      `✅ Queued feedback reminder email for ${hackerName} (${hackerEmail})`,
    );
  }
}

export const feedbackReminderSender = new FeedbackReminderSender();
