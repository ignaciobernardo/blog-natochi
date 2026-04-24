import ApprovedSubmissionEmail25 from '@/src/emails/submissions/approved-25';
import { sendEmail } from '@/src/lib/email';
import { extractGithubUsername } from '@/src/operators/emails/submissions/utils';
import {
  getSubmissionDetails,
  getSubmissionStatusHistory,
} from '@/src/queries/submissions';

interface SendApprovedSubmissionEmail25Params {
  submissionId: string;
  sentByUserId: string | null;
}

export class ApprovedSubmissionEmailSender25 {
  async sendToAllMembers(
    params: SendApprovedSubmissionEmail25Params,
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
          template: ApprovedSubmissionEmail25,
          templateProps: {
            hackerName: member.fullName,
            hackerGithub: member.github || member.fullName,
            hackerPublicId: member.publicId,
            isTeam: submissionDetails.submission.isTeam,
            teamMembers,
            hasSelfFinanceCommitment,
          },
          to: member.email,
          subject: `Bienvenid@ a Platanus Hack 25, ${githubUsername}`,
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

export const approvedSubmissionEmailSender25 =
  new ApprovedSubmissionEmailSender25();
