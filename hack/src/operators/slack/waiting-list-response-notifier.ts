import { getAdminSubmissionPathById } from '@/src/lib/admin/events';
import { COUNTRIES } from '@/src/lib/constants';
import { resolveUrl } from '@/src/lib/utils/url';
import { getSubmissionDetails } from '@/src/queries/submissions';
import { slackService } from '@/src/services/slack';

interface WaitingListNotificationData {
  submissionId: string;
}

export class WaitingListResponseNotifier {
  async notifyWaitingListJoin(
    data: WaitingListNotificationData,
  ): Promise<void> {
    try {
      const submissionDetails = await getSubmissionDetails(data.submissionId);

      if (!submissionDetails) {
        console.error(
          'Failed to send Slack notification: Submission not found',
        );
        return;
      }

      const submissionType =
        submissionDetails.submission.modality === 'solo'
          ? 'solo'
          : submissionDetails.submission.modality === 'team_looking'
            ? 'team_looking'
            : 'team';

      const typeText =
        submissionType === 'team'
          ? 'postulación de equipo'
          : submissionType === 'solo'
            ? 'postulación solo'
            : 'postulación buscando equipo';

      const githubUsers = submissionDetails.members
        .map((member) => {
          if (!member.github) return null;
          const username = member.github.includes('github.com')
            ? member.github.split('/').pop()
            : member.github;
          return username;
        })
        .filter((username): username is string => username !== null);

      const githubUsersText =
        githubUsers.length > 0 ? githubUsers.join(', ') : 'N/A';

      const country = COUNTRIES.find(
        (c) => c.code === submissionDetails.submission.country,
      );
      const countryEmoji = country?.emoji || '';

      const submissionUrl = resolveUrl(
        await getAdminSubmissionPathById(data.submissionId),
      );

      const message = `📋 La <${submissionUrl}|${typeText}> ${countryEmoji} de ${githubUsersText} se unió a la lista de espera`;

      await slackService.sendMessage(message, { unfurlLinks: false });

      console.log('✅ Slack waiting list notification sent successfully');
    } catch (error) {
      console.error('Failed to send Slack waiting list notification:', error);
    }
  }
}

export const waitingListResponseNotifier = new WaitingListResponseNotifier();
