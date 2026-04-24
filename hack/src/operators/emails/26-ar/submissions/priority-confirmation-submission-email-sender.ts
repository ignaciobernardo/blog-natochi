import ConfirmationPrioritySubmissionEmail26Ar from '@/src/emails/submissions/confirmation-priority-26-ar';
import { sendEmail } from '@/src/lib/email';
import {
  extractGithubUsername,
  filterMembersByRecipientEmails,
} from '@/src/operators/emails/submissions/utils';
import { getSubmissionDetails } from '@/src/queries/submissions';

interface SendPriorityConfirmationSubmissionEmail26ArParams {
  submissionId: string;
  sentByUserId: string | null;
  recipientEmails?: string[];
}

function formatPriorityAnswerDate(
  date: Date | null | undefined,
): string | null {
  if (!date) {
    return null;
  }

  return `${new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(date)} (hora de Buenos Aires)`;
}

export class PriorityConfirmationSubmissionEmailSender26Ar {
  async sendToAllMembers(
    params: SendPriorityConfirmationSubmissionEmail26ArParams,
  ): Promise<void> {
    try {
      const submissionDetails = await getSubmissionDetails(params.submissionId);

      if (!submissionDetails) {
        console.error(
          `Failed to send priority confirmation emails: Submission ${params.submissionId} not found`,
        );
        return;
      }

      if (submissionDetails.members.length === 0) {
        console.error(
          `Failed to send priority confirmation emails: No members found for submission ${params.submissionId}`,
        );
        return;
      }

      const membersToEmail = filterMembersByRecipientEmails(
        submissionDetails.members,
        params.recipientEmails,
      );

      if (membersToEmail.length === 0) {
        console.log(
          `No matching recipients found for priority confirmation email on submission ${params.submissionId}`,
        );
        return;
      }

      const teamMembers = submissionDetails.members.map((m) => ({
        fullName: m.fullName,
        github: m.github,
      }));
      const formattedPriorityAnswerDate = formatPriorityAnswerDate(
        submissionDetails.event.priorityAnswerDate,
      );

      const emailPromises = membersToEmail.map(async (member) => {
        const githubUsername =
          extractGithubUsername(member.github) || member.fullName;

        await sendEmail({
          templateName: 'confirmation-submission-priority',
          template: ConfirmationPrioritySubmissionEmail26Ar,
          templateProps: {
            hackerName: member.fullName,
            hackerGithub: member.github || member.fullName,
            isTeam: submissionDetails.submission.isTeam,
            priorityAnswerDate: formattedPriorityAnswerDate,
            teamMembers,
          },
          to: member.email,
          subject: `Postulación recibida para Platanus Hack 26: Buenos Aires, ${githubUsername}`,
          sentByUserId: params.sentByUserId,
        });
      });

      await Promise.all(emailPromises);

      console.log(
        `✅ Priority confirmation emails queued for ${membersToEmail.length} team members`,
      );
    } catch (error) {
      console.error('Failed to send priority confirmation emails:', error);
    }
  }
}

export const priorityConfirmationSubmissionEmailSender26Ar =
  new PriorityConfirmationSubmissionEmailSender26Ar();
