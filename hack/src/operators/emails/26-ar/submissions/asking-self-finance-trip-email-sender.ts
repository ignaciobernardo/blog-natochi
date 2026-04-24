import AskingSelfFinanceTripEmail from '@/src/emails/submissions/asking-self-finance-trip';
import { sendEmail } from '@/src/lib/email';
import {
  getLatestStatusChange,
  getSubmissionDetails,
} from '@/src/queries/submissions';

interface SendAskingSelfFinanceTripEmail26ArParams {
  submissionId: string;
  sentByUserId: string;
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

export class AskingSelfFinanceTripEmailSender26Ar {
  async sendToAllMembers(
    params: SendAskingSelfFinanceTripEmail26ArParams,
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

      const teamMembers = submissionDetails.members.map((member) => ({
        fullName: member.fullName,
        github: member.github,
      }));

      await Promise.all(
        submissionDetails.members.map((member) =>
          sendEmail({
            templateName: 'asking-self-finance-trip',
            template: AskingSelfFinanceTripEmail,
            templateProps: {
              hackerName: member.fullName,
              hackerGithub: member.github || member.fullName,
              hackerPublicId: member.publicId,
              isTeam: submissionDetails.submission.isTeam,
              modality: submissionDetails.submission.modality,
              teamMembers,
              deadline: formattedDeadline,
            },
            to: member.email,
            subject: 'Sobre vuelo a Chile | 48 horas para responder',
            sentByUserId: params.sentByUserId,
          }),
        ),
      );
    } catch (error) {
      console.error('Failed to send self-finance trip emails:', error);
    }
  }
}

export const askingSelfFinanceTripEmailSender26Ar =
  new AskingSelfFinanceTripEmailSender26Ar();
