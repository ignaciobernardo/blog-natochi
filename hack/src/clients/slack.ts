interface SlackMessage {
  channel: string;
  text: string;
  blocks?: SlackBlock[];
  unfurl_links?: boolean;
  unfurl_media?: boolean;
}

interface SlackBlock {
  type: string;
  text?: {
    type: string;
    text: string;
  };
  fields?: Array<{
    type: string;
    text: string;
  }>;
}

export class SlackClient {
  private botToken: string;
  private baseUrl = 'https://slack.com/api';

  constructor(botToken: string) {
    this.botToken = botToken;
  }

  async sendMessage(message: SlackMessage): Promise<void> {
    if (!this.botToken) {
      throw new Error('Slack bot token is not configured');
    }

    try {
      const response = await fetch(`${this.baseUrl}/chat.postMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          Authorization: `Bearer ${this.botToken}`,
        },
        body: JSON.stringify(message),
      });

      const result = await response.json();

      if (!result.ok) {
        throw new Error(
          `Slack API error: ${result.error || 'Unknown error'}${result.warning ? ` (warning: ${result.warning})` : ''}`,
        );
      }
    } catch (error) {
      console.error('Failed to send Slack message:', {
        channel: message.channel,
        hasBlocks: !!message.blocks,
        blocksCount: message.blocks?.length || 0,
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  async sendPlainMessage(params: {
    channel: string;
    message: string;
  }): Promise<void> {
    const { channel, message } = params;

    await this.sendMessage({
      channel,
      text: message,
    });
  }
}
