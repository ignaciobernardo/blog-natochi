import RejectedSubmissionEmail26Ar from '@/src/emails/submissions/rejected-26-ar';
import { sendEmail } from '@/src/lib/email';
import { resolveUrl } from '@/src/lib/utils/url';
import { extractGithubUsername } from '@/src/operators/emails/submissions/utils';
import { getSubmissionDetails } from '@/src/queries/submissions';

interface SendRejectedSubmissionEmail26ArParams {
  submissionId: string;
  sentByUserId: string | null;
}

export class RejectedSubmissionEmailSender26Ar {
  async sendToAllMembers(
    params: SendRejectedSubmissionEmail26ArParams,
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
            templateName: 'rejected-submission',
            template: RejectedSubmissionEmail26Ar,
            templateProps: {
              hackerName: member.fullName,
              hackerGithub: member.github || member.fullName,
              modality: submissionDetails.submission.modality,
              teamMembers,
              hackerGender: member.gender,
              waitingListUrl: resolveUrl(
                `/hacker/${member.publicId}/waiting-list`,
              ),
            },
            to: member.email,
            subject: `Postulación a Platanus Hack 26: Buenos Aires, ${githubUsername}`,
            sentByUserId: params.sentByUserId,
          });
        }),
      );
    } catch (error) {
      console.error('Failed to send rejection emails:', error);
    }
  }
}

export const rejectedSubmissionEmailSender26Ar =
  new RejectedSubmissionEmailSender26Ar();
