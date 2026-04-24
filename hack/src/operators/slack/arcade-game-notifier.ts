import type { ArcadeGameFlat } from '@/src/queries/arcade-games';
import { slackService } from '@/src/services/slack';

export class ArcadeGameNotifier {
  async notifyGameSubmission(
    game: ArcadeGameFlat,
    reviewUrl: string,
  ): Promise<void> {
    try {
      await slackService.sendRichMessage({
        text: `🎮 New Arcade Game Submitted: ${game.title}`,
        unfurl_links: false,
        unfurl_media: false,
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '🎮 New Arcade Game Submitted!',
              emoji: true,
            },
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Title:*\n${game.title}`,
              },
              {
                type: 'mrkdwn',
                text: '*Status:*\n✅ Submitted',
              },
              {
                type: 'mrkdwn',
                text: `*Repository:*\n<${game.repoUrl}|${game.githubUsername}/${game.repoName}>`,
              },
              {
                type: 'mrkdwn',
                text: `*Commit SHA:*\n\`${game.commitSha ? game.commitSha.substring(0, 7) : 'N/A'}\``,
              },
            ],
          },
          ...(game.description
            ? [
                {
                  type: 'section',
                  text: {
                    type: 'mrkdwn',
                    text: `*Description:*\n${game.description}`,
                  },
                },
              ]
            : []),
          {
            type: 'divider',
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '*📊 Game Details*',
            },
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Slug:*\n\`${game.slug}\``,
              },
              {
                type: 'mrkdwn',
                text: `*Version:*\nv${game.versionNumber}`,
              },
            ],
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `<${reviewUrl}|🔍 View Game Review>`,
            },
          },
        ],
      });

      console.log('✅ Arcade game Slack notification sent successfully');
    } catch (error) {
      console.error('Failed to send arcade game Slack notification:', error);
    }
  }
}

export const arcadeGameNotifier = new ArcadeGameNotifier();
