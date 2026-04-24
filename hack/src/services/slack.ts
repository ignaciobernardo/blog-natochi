import { SlackClient } from '@/src/clients/slack';
import { isDevelopmentEnvironment } from '@/src/lib/constants';
import {
  extractMentions,
  hasMentions,
  replaceMentions,
} from '@/src/lib/utils/slack-mentions';

interface SlackBlock {
  type: string;
  text?: {
    type: string;
    text: string;
    emoji?: boolean;
  };
  fields?: Array<{
    type: string;
    text: string;
  }>;
}

interface SendMessageOptions {
  unfurlLinks?: boolean;
  parseMentions?: boolean;
}

interface RichMessageOptions {
  text: string;
  blocks?: SlackBlock[];
  channel?: string;
  unfurl_links?: boolean;
  unfurl_media?: boolean;
  parseMentions?: boolean;
}

class SlackService {
  private client: SlackClient;
  private isDevelopment: boolean;
  private defaultChannel: string;
  private botToken: string;

  constructor() {
    this.isDevelopment = isDevelopmentEnvironment;

    // Get bot token and appropriate channel based on environment
    this.botToken = process.env.SLACK_BOT_TOKEN || '';
    this.defaultChannel = this.isDevelopment
      ? process.env.SLACK_CHANNEL_DEV || '#dev-notifications'
      : process.env.SLACK_CHANNEL_PROD || '#prod-notifications';

    if (!this.botToken) {
      console.warn('Slack bot token not configured');
    }

    this.client = new SlackClient(this.botToken);
  }

  async sendMessage(
    message: string,
    options: SendMessageOptions = {},
  ): Promise<void> {
    const { unfurlLinks = true, parseMentions = false } = options;

    try {
      const adaptedMessage = parseMentions
        ? await this.adaptMessageWithMentions(message)
        : message;

      await this.client.sendMessage({
        channel: this.defaultChannel,
        text: adaptedMessage,
        unfurl_links: unfurlLinks,
        unfurl_media: unfurlLinks,
      });
    } catch (error) {
      console.error('Failed to send Slack notification:', error);
      // Don't throw error to prevent breaking the main flow
    }
  }

  async sendRichMessage(options: RichMessageOptions): Promise<void> {
    try {
      const shouldParseMentions = options.parseMentions ?? true;

      const adaptedText = shouldParseMentions
        ? await this.adaptMessageWithMentions(options.text)
        : options.text;

      const adaptedBlocks = shouldParseMentions
        ? await this.adaptBlocksWithMentions(options.blocks || [])
        : options.blocks;

      await this.client.sendMessage({
        channel: options.channel || this.defaultChannel,
        text: adaptedText,
        blocks: adaptedBlocks,
        unfurl_links: options.unfurl_links ?? true,
        unfurl_media: options.unfurl_media ?? true,
      });
    } catch (error) {
      console.error('Failed to send Slack rich message:', {
        channel: options.channel || this.defaultChannel,
        textLength: options.text.length,
        blocksCount: options.blocks?.length || 0,
        error: error instanceof Error ? error.message : error,
      });
      throw error; // Re-throw to propagate error up
    }
  }

  getChannel(): string {
    return this.defaultChannel;
  }

  async notifySubmissionStatusChange(
    fromStatus: string,
    toStatus: string,
    submissionId: string,
  ): Promise<void> {
    const message = `📊 Submission status changed: *${fromStatus}* → *${toStatus}* (ID: ${submissionId})`;
    await this.sendMessage(message, { unfurlLinks: false });
  }

  private async adaptMessageWithMentions(text: string): Promise<string> {
    if (!hasMentions(text)) {
      return text;
    }

    const mentions = extractMentions(text);
    const usernames = mentions.map((m) => m.username);

    const mentionMap = await this.resolveSlackMentions(usernames);

    if (mentionMap.notFound.length > 0) {
      console.warn('Could not resolve Slack mentions:', mentionMap.notFound);
    }

    return replaceMentions(text, mentionMap.found);
  }

  private async resolveSlackMentions(usernames: string[]): Promise<{
    found: Map<string, string>;
    notFound: string[];
  }> {
    const found = new Map<string, string>();
    const notFound: string[] = [];

    if (usernames.length === 0) {
      return { found, notFound };
    }

    if (!this.botToken) {
      console.warn('Slack bot token not configured for mention resolution');
      return { found, notFound: usernames };
    }

    try {
      const slackUsers = await this.fetchSlackUsers();
      if (!slackUsers) {
        return { found, notFound: usernames };
      }

      for (const username of usernames) {
        const user = slackUsers.find(
          (u: { name: string }) =>
            u.name.toLowerCase() === username.toLowerCase(),
        );

        if (user?.id) {
          found.set(username, `<@${user.id}>`);
        } else {
          notFound.push(username);
        }
      }
    } catch (error) {
      console.error('Error resolving Slack mentions:', error);
      return { found, notFound: usernames };
    }

    return { found, notFound };
  }

  private async fetchSlackUsers(): Promise<Array<{
    id: string;
    name: string;
  }> | null> {
    try {
      const response = await fetch('https://slack.com/api/users.list', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.botToken}`,
        },
      });

      const result = await response.json();

      if (!result.ok) {
        console.error('Slack API error:', result.error);
        return null;
      }

      return result.members || [];
    } catch (error) {
      console.error('Error fetching Slack users:', error);
      return null;
    }
  }

  private async adaptBlocksWithMentions(
    blocks: SlackBlock[],
  ): Promise<SlackBlock[]> {
    const adaptedBlocks = [];

    for (const block of blocks) {
      const adaptedBlock = { ...block };

      // Adapt text in block.text
      if (adaptedBlock.text?.text) {
        adaptedBlock.text.text = await this.adaptMessageWithMentions(
          adaptedBlock.text.text,
        );
      }

      // Adapt text in block.fields
      if (adaptedBlock.fields) {
        adaptedBlock.fields = await Promise.all(
          adaptedBlock.fields.map(async (field) => ({
            ...field,
            text: await this.adaptMessageWithMentions(field.text),
          })),
        );
      }

      adaptedBlocks.push(adaptedBlock);
    }

    return adaptedBlocks;
  }
}

// Export a singleton instance
export const slackService = new SlackService();
