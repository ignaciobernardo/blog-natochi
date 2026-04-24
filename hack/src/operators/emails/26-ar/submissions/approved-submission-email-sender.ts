import ApprovedSubmissionEmail26Ar from '@/src/emails/submissions/approved-26-ar';
import { sendEmail } from '@/src/lib/email';
import { extractGithubUsername } from '@/src/operators/emails/submissions/utils';
import {
  getSubmissionDetails,
  getSubmissionStatusHistory,
} from '@/src/queries/submissions';

interface SendApprovedSubmissionEmail26ArParams {
  submissionId: string;
  sentByUserId: string | null;
}

export class ApprovedSubmissionEmailSender26Ar {
  async sendToAllMembers(
    params: SendApprovedSubmissionEmail26ArParams,
  ): Promise<void> {
    try {
      const submissionDetails = await getSubmissionDetails(params.submissionId);

      if (!submissionDetails) {
        console.error(
          `Failed to send approval emails: Submission ${params.submissionId} not found`,
        );
        return;
      }

      if (submissionDetails.members.length === 0) {
        console.error(
          `Failed to send approval emails: No members found for submission ${params.submissionId}`,
        );
        return;
      }

      const statusHistory = await getSubmissionStatusHistory(
        params.submissionId,
      );
      const hasSelfFinanceCommitment = statusHistory.some(
        (history) => history.toStatus === 'asking_self_finance_trip',
      );

      const teamMembers = submissionDetails.members.map((m) => ({
        fullName: m.fullName,
        github: m.github,
      }));

      const emailPromises = submissionDetails.members.map(async (member) => {
        const githubUsername =
          extractGithubUsername(member.github) || member.fullName;

        await sendEmail({
          templateName: 'approved-submission',
          template: ApprovedSubmissionEmail26Ar,
          templateProps: {
            hackerName: member.fullName,
            hackerGithub: member.github || member.fullName,
            hackerPublicId: member.publicId,
            isTeam: submissionDetails.submission.isTeam,
            teamMembers,
            hasSelfFinanceCommitment,
          },
          to: member.email,
          subject: `Bienvenid@ a Platanus Hack 26: Buenos Aires, ${githubUsername}`,
          sentByUserId: params.sentByUserId,
        });
      });

      await Promise.all(emailPromises);

      console.log(
        `✅ Approval emails queued for ${submissionDetails.members.length} team members`,
      );
    } catch (error) {
      console.error('Failed to send approval emails:', error);
    }
  }
}

export const approvedSubmissionEmailSender26Ar =
  new ApprovedSubmissionEmailSender26Ar();
