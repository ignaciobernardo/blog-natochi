import SelfFinanceRejectionEmail from '@/src/emails/submissions/self-finance-rejection';
import { sendEmail } from '@/src/lib/email';
import { extractGithubUsername } from '@/src/operators/emails/submissions/utils';
import { getSubmissionDetails } from '@/src/queries/submissions';

interface SendSelfFinanceRejectionEmail26ArParams {
  submissionId: string;
  sentByUserId: string | null;
}

export class SelfFinanceRejectionEmailSender26Ar {
  async sendToAllMembers(
    params: SendSelfFinanceRejectionEmail26ArParams,
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
            templateName: 'self-finance-rejection',
            template: SelfFinanceRejectionEmail,
            templateProps: {
              hackerName: member.fullName,
              hackerGithub: member.github || member.fullName,
              isTeam: submissionDetails.submission.isTeam,
              modality: submissionDetails.submission.modality,
              teamMembers,
            },
            to: member.email,
            subject: `Platanus Hack 26: Buenos Aires - ${githubUsername}`,
            sentByUserId: params.sentByUserId,
          });
        }),
      );
    } catch (error) {
      console.error('Failed to send self-finance rejection emails:', error);
    }
  }
}

export const selfFinanceRejectionEmailSender26Ar =
  new SelfFinanceRejectionEmailSender26Ar();
