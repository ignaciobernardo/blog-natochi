import RejectedSubmissionEmail25 from '@/src/emails/submissions/rejected-25';
import { sendEmail } from '@/src/lib/email';
import { resolveUrl } from '@/src/lib/utils/url';
import { extractGithubUsername } from '@/src/operators/emails/submissions/utils';
import { getSubmissionDetails } from '@/src/queries/submissions';

interface SendRejectedSubmissionEmail25Params {
  submissionId: string;
  sentByUserId: string | null;
}

export class RejectedSubmissionEmailSender25 {
  async sendToAllMembers(
    params: SendRejectedSubmissionEmail25Params,
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
            template: RejectedSubmissionEmail25,
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
            subject: `Postulación a Platanus Hack 25, ${githubUsername}`,
            sentByUserId: params.sentByUserId,
          });
        }),
      );
    } catch (error) {
      console.error('Failed to send rejection emails:', error);
    }
  }
}

export const rejectedSubmissionEmailSender25 =
  new RejectedSubmissionEmailSender25();
