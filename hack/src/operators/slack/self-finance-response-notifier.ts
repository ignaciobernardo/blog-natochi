import { getAdminSubmissionPathById } from '@/src/lib/admin/events';
import { COUNTRIES } from '@/src/lib/constants';
import { resolveUrl } from '@/src/lib/utils/url';
import { getSubmissionDetails } from '@/src/queries/submissions';
import { slackService } from '@/src/services/slack';

interface SelfFinanceResponseNotificationData {
  submissionId: string;
  accepted: boolean;
}

export class SelfFinanceResponseNotifier {
  async notifySelfFinanceResponse(
    data: SelfFinanceResponseNotificationData,
  ): Promise<void> {
    try {
      // Fetch submission details
      const submissionDetails = await getSubmissionDetails(data.submissionId);

      if (!submissionDetails) {
        console.error(
          'Failed to send Slack notification: Submission not found',
        );
        return;
      }

      // Determine submission type
      const submissionType =
        submissionDetails.submission.modality === 'solo'
          ? 'solo'
          : submissionDetails.submission.modality === 'team_looking'
            ? 'team_looking'
            : 'team';

      // Determine submission type text
      const typeText =
        submissionType === 'team'
          ? 'postulación de equipo'
          : submissionType === 'solo'
            ? 'postulación solo'
            : 'postulación buscando equipo';

      // Extract GitHub usernames from members
      const githubUsers = submissionDetails.members
        .map((member) => {
          if (!member.github) return null;
          // Extract username from GitHub URL or use as-is
          const username = member.github.includes('github.com')
            ? member.github.split('/').pop()
            : member.github;
          return username;
        })
        .filter((username): username is string => username !== null);

      // Format GitHub users
      const githubUsersText =
        githubUsers.length > 0 ? githubUsers.join(', ') : 'N/A';

      // Get country emoji
      const country = COUNTRIES.find(
        (c) => c.code === submissionDetails.submission.country,
      );
      const countryEmoji = country?.emoji || '';

      // Build submission URL
      const submissionUrl = resolveUrl(
        await getAdminSubmissionPathById(data.submissionId),
      );

      // Format message
      const responseEmoji = data.accepted ? '✅' : '❌';
      const responseText = data.accepted
        ? 'aceptó financiar su viaje'
        : 'rechazó financiar su viaje';

      const message = `${responseEmoji} La <${submissionUrl}|${typeText}> ${countryEmoji} de ${githubUsersText} ${responseText}`;

      await slackService.sendMessage(message, { unfurlLinks: false });

      console.log(
        '✅ Slack self-finance response notification sent successfully',
      );
    } catch (error) {
      console.error(
        'Failed to send Slack self-finance response notification:',
        error,
      );
      // Don't throw error to prevent breaking the main flow
    }
  }
}

// Export a singleton instance
export const selfFinanceResponseNotifier = new SelfFinanceResponseNotifier();
