import WithdrawnSubmissionEmail25 from '@/src/emails/submissions/withdrawn-25';
import { sendEmail } from '@/src/lib/email';
import { extractGithubUsername } from '@/src/operators/emails/submissions/utils';
import { getSubmissionDetails } from '@/src/queries/submissions';

interface SendWithdrawnSubmissionEmail25Params {
  submissionId: string;
  sentByUserId: string | null;
}

export class WithdrawnSubmissionEmailSender25 {
  async sendToAllMembers(
    params: SendWithdrawnSubmissionEmail25Params,
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
            template: WithdrawnSubmissionEmail25,
            templateProps: {
              hackerName: member.fullName,
              hackerGithub: member.github || member.fullName,
              teamMembers,
            },
            to: member.email,
            subject: `Cancelación de asistencia a Platanus Hack 25, ${githubUsername}`,
            sentByUserId: params.sentByUserId,
          });
        }),
      );
    } catch (error) {
      console.error('Failed to send withdrawn emails:', error);
    }
  }
}

export const withdrawnSubmissionEmailSender25 =
  new WithdrawnSubmissionEmailSender25();
