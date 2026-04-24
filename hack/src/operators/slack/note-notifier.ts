import { COUNTRIES } from '@/src/lib/constants';
import { slackService } from '@/src/services/slack';

interface NoteNotificationData {
  adminName: string;
  submissionId: string;
  noteBody: string;
  submissionUrl: string;
  submissionType: 'team' | 'solo' | 'team_looking';
  githubUsers: string[];
  countryCode: string;
}

export class NoteNotifier {
  async notifyNewNote(data: NoteNotificationData): Promise<void> {
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

      // Format message with blockquote
      const message = `${data.adminName} comentó en la <${data.submissionUrl}|${typeText}> ${countryEmoji} de ${githubUsersText}:\n> ${data.noteBody}`;

      await slackService.sendMessage(message, {
        unfurlLinks: false,
        parseMentions: true,
      });

      console.log('✅ Slack note notification sent successfully');
    } catch (error) {
      console.error('Failed to send Slack note notification:', error);
      // Don't throw error to prevent breaking the main flow
    }
  }
}

// Export a singleton instance
export const noteNotifier = new NoteNotifier();
