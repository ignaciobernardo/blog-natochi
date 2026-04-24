import OnboardingRequestEmail25 from '@/src/emails/submissions/onboarding-request-25';
import { sendEmail } from '@/src/lib/email';
import {
  getLatestStatusChange,
  getSubmissionDetails,
} from '@/src/queries/submissions';

interface SendOnboardingRequestEmail25Params {
  submissionId: string;
  sentByUserId: string | null;
}

function formatDeadline(date: Date): string {
  return date.toLocaleString('es-CL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Santiago',
  });
}

export class OnboardingRequestEmailSender25 {
  async sendToAllMembers(
    params: SendOnboardingRequestEmail25Params,
  ): Promise<void> {
    try {
      const submissionDetails = await getSubmissionDetails(params.submissionId);
      if (!submissionDetails) return;
      if (submissionDetails.members.length === 0) return;

      const latestStatusChange = await getLatestStatusChange(
        params.submissionId,
      );
      if (!latestStatusChange) return;

      const deadline = new Date(latestStatusChange.changedAt);
      deadline.setHours(deadline.getHours() + 39);
      const formattedDeadline = formatDeadline(deadline);

      const teamMembers = submissionDetails.members.map((m) => ({
        fullName: m.fullName,
        github: m.github,
      }));

      await Promise.all(
        submissionDetails.members.map((member) =>
          sendEmail({
            templateName: 'onboarding-request',
            template: OnboardingRequestEmail25,
            templateProps: {
              hackerName: member.fullName,
              hackerPublicId: member.publicId,
              isTeam: submissionDetails.submission.isTeam,
              modality: submissionDetails.submission.modality,
              teamMembers,
              deadline: formattedDeadline,
            },
            to: member.email,
            subject: 'Completa tu onboarding | 39 horas para responder',
            sentByUserId: params.sentByUserId,
          }),
        ),
      );
    } catch (error) {
      console.error('Failed to send onboarding request emails:', error);
    }
  }
}

export const onboardingRequestEmailSender25 =
  new OnboardingRequestEmailSender25();
