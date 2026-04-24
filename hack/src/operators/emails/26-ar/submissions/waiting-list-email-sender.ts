import WaitingListEmail26Ar from '@/src/emails/submissions/waiting-list-26-ar';
import { sendEmail } from '@/src/lib/email';
import { extractGithubUsername } from '@/src/operators/emails/submissions/utils';
import { getSubmissionDetails } from '@/src/queries/submissions';

interface SendWaitingListEmail26ArParams {
  submissionId: string;
  sentByUserId: string | null;
}

export class WaitingListEmailSender26Ar {
  async sendToAllMembers(
    params: SendWaitingListEmail26ArParams,
  ): Promise<void> {
    try {
      const submissionDetails = await getSubmissionDetails(params.submissionId);
      if (!submissionDetails || submissionDetails.members.length === 0) return;

      const teamMembers = submissionDetails.members.map((m) => ({
        fullName: m.fullName,
        github: m.github,
      }));

      await Promise.all(
        submissionDetails.members.map((member) => {
          const githubUsername =
            extractGithubUsername(member.github) || member.fullName;

          return sendEmail({
            templateName: 'waiting-list',
            template: WaitingListEmail26Ar,
            templateProps: {
              hackerName: member.fullName,
              hackerGithub: member.github || member.fullName,
              teamMembers,
              hackerGender: member.gender,
            },
            to: member.email,
            subject: `Lista de Espera - Platanus Hack 26: Buenos Aires, ${githubUsername}`,
            sentByUserId: params.sentByUserId,
          });
        }),
      );
    } catch (error) {
      console.error('Failed to send waiting list emails:', error);
    }
  }
}

export const waitingListEmailSender26Ar = new WaitingListEmailSender26Ar();
