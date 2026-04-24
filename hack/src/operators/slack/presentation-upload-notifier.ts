import { slackService } from '@/src/services/slack';

export class PresentationUploadNotifier {
  async notifyPresentationUpload(
    teamSlug: string,
    uploadType: 'slides' | 'demo',
    driveFolderId?: string,
  ): Promise<void> {
    try {
      const emoji = uploadType === 'slides' ? '📊' : '🎥';
      const typeLabel = uploadType === 'slides' ? 'Slides' : 'Demo Video';

      const blocks: any[] = [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `${emoji} ${typeLabel} Uploaded!`,
            emoji: true,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Team:*\n\`${teamSlug}\``,
            },
            {
              type: 'mrkdwn',
              text: `*Type:*\n${typeLabel}`,
            },
          ],
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `A team has uploaded their ${uploadType === 'slides' ? 'presentation slides' : 'demo video'}!`,
          },
        },
      ];

      if (driveFolderId) {
        blocks.push({
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: '📁 View in Google Drive',
                emoji: true,
              },
              url: `https://drive.google.com/drive/folders/${driveFolderId}`,
              style: 'primary',
            },
          ],
        });
      }

      await slackService.sendRichMessage({
        text: `${emoji} ${typeLabel} Uploaded: ${teamSlug}`,
        unfurl_links: false,
        unfurl_media: false,
        blocks,
      });

      console.log(
        `✅ Presentation upload Slack notification sent for ${teamSlug} (${uploadType})`,
      );
    } catch (error) {
      console.error(
        `Failed to send presentation upload Slack notification for ${teamSlug}:`,
        error,
      );
    }
  }
}

export const presentationUploadNotifier = new PresentationUploadNotifier();
