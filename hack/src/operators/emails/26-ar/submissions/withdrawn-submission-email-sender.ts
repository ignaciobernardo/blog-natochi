import WithdrawnSubmissionEmail26Ar from '@/src/emails/submissions/withdrawn-26-ar';
import { sendEmail } from '@/src/lib/email';
import { extractGithubUsername } from '@/src/operators/emails/submissions/utils';
import { getSubmissionDetails } from '@/src/queries/submissions';

interface SendWithdrawnSubmissionEmail26ArParams {
  submissionId: string;
  sentByUserId: string | null;
}

export class WithdrawnSubmissionEmailSender26Ar {
  async sendToAllMembers(
    params: SendWithdrawnSubmissionEmail26ArParams,
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
            templateName: 'withdrawn-submission',
            template: WithdrawnSubmissionEmail26Ar,
            templateProps: {
              hackerName: member.fullName,
              hackerGithub: member.github || member.fullName,
              teamMembers,
            },
            to: member.email,
            subject: `Cancelación de asistencia a Platanus Hack 26: Buenos Aires, ${githubUsername}`,
            sentByUserId: params.sentByUserId,
          });
        }),
      );
    } catch (error) {
      console.error('Failed to send withdrawn emails:', error);
    }
  }
}

export const withdrawnSubmissionEmailSender26Ar =
  new WithdrawnSubmissionEmailSender26Ar();
