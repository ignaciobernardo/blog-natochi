import SelfFinanceExpiredEmail from '@/src/emails/submissions/self-finance-expired';
import { sendEmail } from '@/src/lib/email';
import { extractGithubUsername } from '@/src/operators/emails/submissions/utils';
import { getSubmissionDetails } from '@/src/queries/submissions';

interface SendSelfFinanceExpiredEmail26ArParams {
  submissionId: string;
}

export class SelfFinanceExpiredEmailSender26Ar {
  async sendToAllMembers(
    params: SendSelfFinanceExpiredEmail26ArParams,
  ): Promise<void> {
    try {
      const submissionDetails = await getSubmissionDetails(params.submissionId);
      if (!submissionDetails || submissionDetails.members.length === 0) return;

      const teamMembers = submissionDetails.members.map((member) => ({
        fullName: member.fullName,
        github: member.github,
      }));

      await Promise.all(
        submissionDetails.members.map((member) => {
          const githubUsername =
            extractGithubUsername(member.github) || member.fullName;
          return sendEmail({
            templateName: 'self-finance-expired',
            template: SelfFinanceExpiredEmail,
            templateProps: {
              hackerName: member.fullName,
              hackerGithub: member.github || member.fullName,
              isTeam: submissionDetails.submission.isTeam,
              modality: submissionDetails.submission.modality,
              teamMembers,
            },
            to: member.email,
            subject: `Platanus Hack 26: Buenos Aires - Plazo vencido - ${githubUsername}`,
            sentByUserId: null,
          });
        }),
      );
    } catch (error) {
      console.error('Failed to send self-finance expired emails:', error);
    }
  }
}

export const selfFinanceExpiredEmailSender26Ar =
  new SelfFinanceExpiredEmailSender26Ar();
