import { COUNTRIES } from '@/src/lib/constants';
import { slackService } from '@/src/services/slack';

interface HackerNoteNotificationData {
  adminName: string;
  hackerFullName: string;
  hackerGithub: string | null;
  submissionId: string;
  submissionUrl: string;
  submissionType: 'team' | 'solo' | 'team_looking';
  noteBody: string;
  countryCode: string;
}

export class HackerNoteNotifier {
  async notifyNewNote(data: HackerNoteNotificationData): Promise<void> {
    try {
      // Determine submission type text
      const typeText =
        data.submissionType === 'team'
          ? 'postulación de equipo'
          : data.submissionType === 'solo'
            ? 'postulación solo'
            : 'postulación buscando equipo';

      // Get country emoji
      const country = COUNTRIES.find((c) => c.code === data.countryCode);
      const countryEmoji = country?.emoji || '';

      // Format GitHub username
      const githubUsername = data.hackerGithub
        ? data.hackerGithub.includes('github.com')
          ? data.hackerGithub.split('/').pop()
          : data.hackerGithub
        : 'N/A';

      // Format message with blockquote
      const message = `${data.adminName} comentó en el hacker ${data.hackerFullName} (${githubUsername}) de la <${data.submissionUrl}|${typeText}> ${countryEmoji}:\n> ${data.noteBody}`;

      await slackService.sendMessage(message, {
        unfurlLinks: false,
        parseMentions: true,
      });

      console.log('✅ Slack hacker note notification sent successfully');
    } catch (error) {
      console.error('Failed to send Slack hacker note notification:', error);
      // Don't throw error to prevent breaking the main flow
    }
  }
}

// Export a singleton instance
export const hackerNoteNotifier = new HackerNoteNotifier();
