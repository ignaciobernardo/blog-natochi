import { slackService } from '@/src/services/slack';

interface RunwayRequestNotificationData {
  hackerGithub: string | null;
  runwayEmail: string;
}

export class RunwayRequestNotifier {
  async notifyNewRequest(data: RunwayRequestNotificationData): Promise<void> {
    try {
      const githubUsername = data.hackerGithub
        ? data.hackerGithub.includes('github.com')
          ? data.hackerGithub.split('/').pop()
          : data.hackerGithub
        : 'N/A';

      const message = `🎬 Nueva solicitud de créditos Runway\n*GitHub:* ${githubUsername}\n*Email:* ${data.runwayEmail}`;

      await slackService.sendMessage(message, {
        unfurlLinks: false,
        parseMentions: false,
      });

      console.log('✅ Slack Runway request notification sent successfully');
    } catch (error) {
      console.error('Failed to send Slack Runway request notification:', error);
    }
  }
}

export const runwayRequestNotifier = new RunwayRequestNotifier();
