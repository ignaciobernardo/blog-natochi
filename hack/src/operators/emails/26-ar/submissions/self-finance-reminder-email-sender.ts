import SelfFinanceReminderEmail from '@/src/emails/submissions/self-finance-reminder';
import { sendEmail } from '@/src/lib/email';
import {
  getLatestStatusChange,
  getSubmissionDetails,
  hasEmailBeenSentToAddress,
} from '@/src/queries/submissions';

interface SendSelfFinanceReminderEmail26ArParams {
  submissionId: string;
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

export class SelfFinanceReminderEmailSender26Ar {
  async sendToAllMembers(
    params: SendSelfFinanceReminderEmail26ArParams,
  ): Promise<void> {
    try {
      const submissionDetails = await getSubmissionDetails(params.submissionId);
      if (!submissionDetails || submissionDetails.members.length === 0) return;

      const latestStatusChange = await getLatestStatusChange(
        params.submissionId,
      );
      if (!latestStatusChange) return;

      const deadline = new Date(latestStatusChange.changedAt);
      deadline.setHours(deadline.getHours() + 48);
      const formattedDeadline = formatDeadline(deadline);

      let emailsSent = 0;
      let emailsSkipped = 0;

      for (const member of submissionDetails.members) {
        const alreadySent = await hasEmailBeenSentToAddress(
          member.email,
          'self-finance-reminder',
        );

        if (alreadySent) {
          emailsSkipped++;
          continue;
        }

        await sendEmail({
          templateName: 'self-finance-reminder',
          template: SelfFinanceReminderEmail,
          templateProps: {
            hackerPublicId: member.publicId,
            modality: submissionDetails.submission.modality,
            deadline: formattedDeadline,
          },
          to: member.email,
          subject: 'Recordatorio: 24 horas para responder sobre vuelo',
          sentByUserId: null,
        });

        emailsSent++;
      }

      console.log(
        `✅ Self-finance reminder emails queued: ${emailsSent} sent, ${emailsSkipped} skipped (already sent)`,
      );
    } catch (error) {
      console.error('Failed to send self-finance reminder emails:', error);
    }
  }
}

export const selfFinanceReminderEmailSender26Ar =
  new SelfFinanceReminderEmailSender26Ar();
