import { COUNTRIES } from '@/src/lib/constants';
import { slackService } from '@/src/services/slack';

interface FlightRequestNotificationData {
  adminName: string;
  submissionId: string;
  flightRequestContent: string;
  submissionUrl: string;
  submissionType: 'team' | 'solo' | 'team_looking';
  githubUsers: string[];
  countryCode: string;
}

export class FlightRequestNotifier {
  async notifyNewFlightRequest(
    data: FlightRequestNotificationData,
  ): Promise<void> {
    try {
      // Determine submission type text
      const typeText =
        data.submissionType === 'team'
          ? 'postulación de equipo'
          : data.submissionType === 'solo'
            ? 'postulación solo'
            : 'postulación buscando equipo';

      // Format GitHub users
      const githubUsersText =
        data.githubUsers.length > 0 ? data.githubUsers.join(', ') : 'N/A';

      // Get country emoji
      const country = COUNTRIES.find((c) => c.code === data.countryCode);
      const countryEmoji = country?.emoji || '';

      // Format message with blockquote - truncate content if too long
      const truncatedContent =
        data.flightRequestContent.length > 200
          ? `${data.flightRequestContent.substring(0, 200)}...`
          : data.flightRequestContent;

      const message = `✈️ ${data.adminName} agregó un pedido de vuelo a la <${data.submissionUrl}|${typeText}> ${countryEmoji} de ${githubUsersText}:\n> ${truncatedContent}`;

      await slackService.sendMessage(message, { unfurlLinks: false });

      console.log('✅ Slack flight request notification sent successfully');
    } catch (error) {
      console.error('Failed to send Slack flight request notification:', error);
      // Don't throw error to prevent breaking the main flow
    }
  }
}

// Export a singleton instance
export const flightRequestNotifier = new FlightRequestNotifier();
