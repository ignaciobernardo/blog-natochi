import WaitingListEmail25 from '@/src/emails/submissions/waiting-list-25';
import { sendEmail } from '@/src/lib/email';
import { extractGithubUsername } from '@/src/operators/emails/submissions/utils';
import { getSubmissionDetails } from '@/src/queries/submissions';

interface SendWaitingListEmail25Params {
  submissionId: string;
  sentByUserId: string | null;
}

export class WaitingListEmailSender25 {
  async sendToAllMembers(params: SendWaitingListEmail25Params): Promise<void> {
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
            template: WaitingListEmail25,
            templateProps: {
              hackerName: member.fullName,
              hackerGithub: member.github || member.fullName,
              teamMembers,
              hackerGender: member.gender,
            },
            to: member.email,
            subject: `Lista de Espera - Platanus Hack 25, ${githubUsername}`,
            sentByUserId: params.sentByUserId,
          });
        }),
      );
    } catch (error) {
      console.error('Failed to send waiting list emails:', error);
    }
  }
}

export const waitingListEmailSender25 = new WaitingListEmailSender25();
