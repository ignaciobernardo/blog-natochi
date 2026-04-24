import { getAdminSubmissionPathById } from '@/src/lib/admin/events';
import { COUNTRIES } from '@/src/lib/constants';
import type { SubmissionStatus } from '@/src/lib/db/schema';
import { resolveUrl } from '@/src/lib/utils/url';
import { getSubmissionDetails } from '@/src/queries/submissions';
import { slackService } from '@/src/services/slack';

interface StatusChangeNotificationData {
  adminName: string;
  submissionId: string;
  fromStatus: SubmissionStatus;
  toStatus: SubmissionStatus;
}

const statusConfig: Record<SubmissionStatus, { text: string; emoji: string }> =
  {
    received: { text: 'recibida', emoji: '📨' },
    priority_waiting: { text: 'en espera prioritaria', emoji: '⏳' },
    asking_self_finance_trip: {
      text: 'pidiendo autofinanciamiento',
      emoji: '✈️',
    },
    approved: { text: 'aprobada', emoji: '✅' },
    onboarding_request: { text: 'onboarding solicitado', emoji: '📧' },
    onboarding_expired: { text: 'onboarding expirado', emoji: '⏰' },
    onboarding_complete: { text: 'onboarding completo', emoji: '🎉' },
    rejected: { text: 'rechazada', emoji: '❌' },
    waiting_list: { text: 'en lista de espera', emoji: '📋' },
    withdrawn: { text: 'retirada', emoji: '🚪' },
    archived: { text: 'archivada', emoji: '📦' },
  };

export class StatusChangeNotifier {
  async notifyStatusChange(data: StatusChangeNotificationData): Promise<void> {
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

      // Get status configs
      const fromConfig = statusConfig[data.fromStatus];
      const toConfig = statusConfig[data.toStatus];

      // Build submission URL
      const submissionUrl = resolveUrl(
        await getAdminSubmissionPathById(data.submissionId),
      );

      // Format message
      const message = `${data.adminName} cambió el estado de la <${submissionUrl}|${typeText}> ${countryEmoji} de ${githubUsersText} de ${fromConfig.emoji} ${fromConfig.text} a ${toConfig.emoji} ${toConfig.text}`;

      await slackService.sendMessage(message, { unfurlLinks: false });

      console.log('✅ Slack status change notification sent successfully');
    } catch (error) {
      console.error('Failed to send Slack status change notification:', error);
      // Don't throw error to prevent breaking the main flow
    }
  }
}

// Export a singleton instance
export const statusChangeNotifier = new StatusChangeNotifier();
