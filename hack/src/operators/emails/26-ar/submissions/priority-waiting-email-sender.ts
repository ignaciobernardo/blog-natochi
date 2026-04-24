import PriorityWaitingEmail26Ar from '@/src/emails/submissions/priority-waiting-26-ar';
import { sendEmail } from '@/src/lib/email';
import { extractGithubUsername } from '@/src/operators/emails/submissions/utils';
import { getSubmissionDetails } from '@/src/queries/submissions';

interface SendPriorityWaitingEmail26ArParams {
  submissionId: string;
  sentByUserId: string | null;
}

export class PriorityWaitingEmailSender26Ar {
  async sendToAllMembers(
    params: SendPriorityWaitingEmail26ArParams,
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
            templateName: 'priority-waiting',
            template: PriorityWaitingEmail26Ar,
            templateProps: {
              hackerName: member.fullName,
              hackerGithub: member.github || member.fullName,
              isTeam: submissionDetails.members.length > 1,
              teamMembers,
            },
            to: member.email,
            subject: `Estado de postulación, ${githubUsername}`,
            sentByUserId: params.sentByUserId,
          });
        }),
      );
    } catch (error) {
      console.error('Failed to send priority waiting emails:', error);
    }
  }
}

export const priorityWaitingEmailSender26Ar =
  new PriorityWaitingEmailSender26Ar();
