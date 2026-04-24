import ConfirmationSubmissionEmail26Ar from '@/src/emails/submissions/confirmation-26-ar';
import { sendEmail } from '@/src/lib/email';
import {
  extractGithubUsername,
  filterMembersByRecipientEmails,
} from '@/src/operators/emails/submissions/utils';
import { getSubmissionDetails } from '@/src/queries/submissions';

interface SendConfirmationSubmissionEmail26ArParams {
  submissionId: string;
  sentByUserId: string | null;
  recipientEmails?: string[];
}

export class ConfirmationSubmissionEmailSender26Ar {
  async sendToAllMembers(
    params: SendConfirmationSubmissionEmail26ArParams,
  ): Promise<void> {
    try {
      const submissionDetails = await getSubmissionDetails(params.submissionId);

      if (!submissionDetails) {
        console.error(
          `Failed to send confirmation emails: Submission ${params.submissionId} not found`,
        );
        return;
      }

      if (submissionDetails.members.length === 0) {
        console.error(
          `Failed to send confirmation emails: No members found for submission ${params.submissionId}`,
        );
        return;
      }

      const membersToEmail = filterMembersByRecipientEmails(
        submissionDetails.members,
        params.recipientEmails,
      );

      if (membersToEmail.length === 0) {
        console.log(
          `No matching recipients found for submission ${params.submissionId}`,
        );
        return;
      }

      const teamMembers = submissionDetails.members.map((m) => ({
        fullName: m.fullName,
        github: m.github,
      }));

      const emailPromises = membersToEmail.map(async (member) => {
        const githubUsername =
          extractGithubUsername(member.github) || member.fullName;

        await sendEmail({
          templateName: 'confirmation-submission',
          template: ConfirmationSubmissionEmail26Ar,
          templateProps: {
            hackerName: member.fullName,
            hackerGithub: member.github || member.fullName,
            isTeam: submissionDetails.submission.isTeam,
            teamMembers,
          },
          to: member.email,
          subject: `Recibimos tu postulación a Platanus Hack 26: Buenos Aires, ${githubUsername}`,
          sentByUserId: params.sentByUserId,
        });
      });

      await Promise.all(emailPromises);

      console.log(
        `✅ Confirmation emails queued for ${membersToEmail.length} team members`,
      );
    } catch (error) {
      console.error('Failed to send confirmation emails:', error);
    }
  }
}

export const confirmationSubmissionEmailSender26Ar =
  new ConfirmationSubmissionEmailSender26Ar();
