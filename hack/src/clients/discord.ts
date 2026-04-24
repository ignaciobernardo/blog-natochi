interface DiscordOAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  global_name: string | null;
}

interface AddGuildMemberParams {
  userId: string;
  accessToken: string;
}

interface SetNicknameParams {
  userId: string;
  nickname: string;
}

interface AddRoleParams {
  userId: string;
  roleId: string;
}

interface SendMessageParams {
  channelId: string;
  content: string;
}

interface DiscordRole {
  id: string;
  name: string;
  color: number;
  position: number;
  permissions: string;
}

interface CreateRoleParams {
  name: string;
  color?: number;
  permissions?: string;
}

export class DiscordClient {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private botToken: string;
  private guildId: string;
  private baseUrl = 'https://discord.com/api/v10';
  private sendMessagesEnabled: boolean;

  constructor(config: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    botToken: string;
    guildId: string;
  }) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.redirectUri = config.redirectUri;
    this.botToken = config.botToken;
    this.guildId = config.guildId;
    this.sendMessagesEnabled = process.env.DISCORD_SEND_MESSAGES === 'true';
  }

  getOAuthUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'identify guilds.join',
    });

    if (state) {
      params.set('state', state);
    }

    return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
  }

  async exchangeCode(code: string): Promise<DiscordOAuthTokenResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          grant_type: 'authorization_code',
          code,
          redirect_uri: this.redirectUri,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          `Discord OAuth token exchange failed: ${error.error_description || error.error || 'Unknown error'}`,
        );
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to exchange Discord OAuth code:', error);
      throw error;
    }
  }

  async getUser(accessToken: string): Promise<DiscordUser> {
    try {
      const response = await fetch(`${this.baseUrl}/users/@me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          `Failed to get Discord user: ${error.message || 'Unknown error'}`,
        );
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get Discord user:', error);
      throw error;
    }
  }

  async addGuildMember(params: AddGuildMemberParams): Promise<void> {
    const { userId, accessToken } = params;

    try {
      const response = await fetch(
        `${this.baseUrl}/guilds/${this.guildId}/members/${userId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bot ${this.botToken}`,
          },
          body: JSON.stringify({
            access_token: accessToken,
          }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          `Failed to add member to guild: ${error.message || 'Unknown error'}`,
        );
      }
    } catch (error) {
      console.error('Failed to add Discord guild member:', {
        userId,
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  async setNickname(params: SetNicknameParams): Promise<void> {
    const { userId, nickname } = params;

    try {
      const response = await fetch(
        `${this.baseUrl}/guilds/${this.guildId}/members/${userId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bot ${this.botToken}`,
          },
          body: JSON.stringify({
            nick: nickname,
          }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          `Failed to set nickname: ${error.message || 'Unknown error'}`,
        );
      }
    } catch (error) {
      console.error('Failed to set Discord nickname:', {
        userId,
        nickname,
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  async addRole(params: AddRoleParams): Promise<void> {
    const { userId, roleId } = params;

    try {
      const response = await fetch(
        `${this.baseUrl}/guilds/${this.guildId}/members/${userId}/roles/${roleId}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bot ${this.botToken}`,
          },
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          `Failed to add role: ${error.message || 'Unknown error'}`,
        );
      }
    } catch (error) {
      console.error('Failed to add Discord role:', {
        userId,
        roleId,
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  async sendMessage(params: SendMessageParams): Promise<void> {
    const { channelId, content } = params;

    if (!this.sendMessagesEnabled) {
      console.log('[Discord - DRY RUN] Would send message to channel:', {
        channelId,
        content,
      });
      return;
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/channels/${channelId}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bot ${this.botToken}`,
          },
          body: JSON.stringify({
            content,
          }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          `Failed to send message: ${error.message || 'Unknown error'}`,
        );
      }
    } catch (error) {
      console.error('Failed to send Discord message:', {
        channelId,
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  async getGuildRoles(): Promise<DiscordRole[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/guilds/${this.guildId}/roles`,
        {
          headers: {
            Authorization: `Bot ${this.botToken}`,
          },
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          `Failed to get guild roles: ${error.message || 'Unknown error'}`,
        );
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get Discord guild roles:', error);
      throw error;
    }
  }

  async getRoleIdByName(roleName: string): Promise<string | null> {
    try {
      const roles = await this.getGuildRoles();
      const role = roles.find(
        (r) => r.name.toLowerCase() === roleName.toLowerCase(),
      );
      return role?.id || null;
    } catch (error) {
      console.error('Failed to get role ID by name:', { roleName, error });
      return null;
    }
  }

  async createRole(params: CreateRoleParams): Promise<DiscordRole> {
    const { name, color = 0, permissions = '0' } = params;

    try {
      const response = await fetch(
        `${this.baseUrl}/guilds/${this.guildId}/roles`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bot ${this.botToken}`,
          },
          body: JSON.stringify({
            name,
            color,
            permissions,
          }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          `Failed to create role: ${error.message || 'Unknown error'}`,
        );
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to create Discord role:', {
        name,
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  async getOrCreateRole(roleName: string): Promise<string | null> {
    try {
      const existingRoleId = await this.getRoleIdByName(roleName);
      if (existingRoleId) {
        return existingRoleId;
      }

      console.log(`[Discord] Role "${roleName}" not found, creating it...`);
      const newRole = await this.createRole({ name: roleName });
      console.log(
        `[Discord] ✅ Role "${roleName}" created with ID: ${newRole.id}`,
      );
      return newRole.id;
    } catch (error) {
      console.error('Failed to get or create role:', { roleName, error });
      return null;
    }
  }

  // Music Bot Methods
  async registerGlobalCommands(commands: any[]): Promise<void> {
    try {
      const response = await fetch(
        `${this.baseUrl}/applications/${this.clientId}/commands`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bot ${this.botToken}`,
          },
          body: JSON.stringify(commands),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          `Failed to register commands: ${error.message || 'Unknown error'}`,
        );
      }

      console.log('[Discord] ✅ Global commands registered');
    } catch (error) {
      console.error('Failed to register Discord commands:', error);
      throw error;
    }
  }

  async sendMessageWithEmbed(params: {
    channelId: string;
    embed: any;
    components?: any[];
  }): Promise<any> {
    if (!this.sendMessagesEnabled) {
      console.log('[Discord - DRY RUN] Would send embed message to channel:', {
        channelId: params.channelId,
        embed: params.embed,
        components: params.components,
      });
      return { id: 'dry-run' };
    }

    try {
      const body: any = {
        embeds: [params.embed],
      };

      if (params.components) {
        body.components = params.components;
      }

      const response = await fetch(
        `${this.baseUrl}/channels/${params.channelId}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bot ${this.botToken}`,
          },
          body: JSON.stringify(body),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          `Failed to send message: ${error.message || 'Unknown error'}`,
        );
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to send Discord message with embed:', error);
      throw error;
    }
  }

  async editMessageEmbed(params: {
    channelId: string;
    messageId: string;
    embed: any;
    components?: any[];
  }): Promise<any> {
    if (!this.sendMessagesEnabled) {
      console.log('[Discord - DRY RUN] Would edit embed message:', {
        channelId: params.channelId,
        messageId: params.messageId,
        embed: params.embed,
        components: params.components,
      });
      return { id: 'dry-run' };
    }

    try {
      const body: any = {
        embeds: [params.embed],
      };

      if (params.components) {
        body.components = params.components;
      }

      const response = await fetch(
        `${this.baseUrl}/channels/${params.channelId}/messages/${params.messageId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bot ${this.botToken}`,
          },
          body: JSON.stringify(body),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          `Failed to edit message: ${error.message || 'Unknown error'}`,
        );
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to send Discord message with embed:', error);
      throw error;
    }
  }

  async addReaction(params: {
    channelId: string;
    messageId: string;
    emoji: string;
  }): Promise<void> {
    if (!this.sendMessagesEnabled) {
      console.log('[Discord - DRY RUN] Would add reaction:', {
        channelId: params.channelId,
        messageId: params.messageId,
        emoji: params.emoji,
      });
      return;
    }

    try {
      const encodedEmoji = encodeURIComponent(params.emoji);
      const response = await fetch(
        `${this.baseUrl}/channels/${params.channelId}/messages/${params.messageId}/reactions/${encodedEmoji}/@me`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bot ${this.botToken}`,
          },
        },
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to add reaction: ${error}`);
      }
    } catch (error) {
      console.error('Failed to add Discord reaction:', error);
      throw error;
    }
  }

  async getMessage(params: {
    channelId: string;
    messageId: string;
  }): Promise<any | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/channels/${params.channelId}/messages/${params.messageId}`,
        {
          headers: {
            Authorization: `Bot ${this.botToken}`,
          },
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          `Failed to get message: ${error.message || 'Unknown error'}`,
        );
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get Discord message:', error);
      return null;
    }
  }

  async getReactions(params: {
    channelId: string;
    messageId: string;
    emoji: string;
  }): Promise<any[]> {
    try {
      const encodedEmoji = encodeURIComponent(params.emoji);
      const response = await fetch(
        `${this.baseUrl}/channels/${params.channelId}/messages/${params.messageId}/reactions/${encodedEmoji}`,
        {
          headers: {
            Authorization: `Bot ${this.botToken}`,
          },
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          `Failed to get reactions: ${error.message || 'Unknown error'}`,
        );
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get Discord reactions:', error);
      return [];
    }
  }

  async searchGuildMembers(query: string, limit = 10): Promise<any[]> {
    try {
      const params = new URLSearchParams({
        query,
        limit: limit.toString(),
      });
      const response = await fetch(
        `${this.baseUrl}/guilds/${this.guildId}/members/search?${params.toString()}`,
        {
          headers: {
            Authorization: `Bot ${this.botToken}`,
          },
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          `Failed to search members: ${error.message || 'Unknown error'}`,
        );
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to search Discord guild members:', error);
      return [];
    }
  }

  async listAllGuildMembers(limit = 1000): Promise<any[]> {
    const members: any[] = [];
    let after: string | undefined;

    try {
      while (members.length < limit) {
        const params = new URLSearchParams({ limit: '1000' });
        if (after) params.set('after', after);

        const response = await fetch(
          `${this.baseUrl}/guilds/${this.guildId}/members?${params.toString()}`,
          { headers: { Authorization: `Bot ${this.botToken}` } },
        );

        if (!response.ok) break;

        const batch = await response.json();
        if (batch.length === 0) break;

        members.push(...batch);
        after = batch[batch.length - 1].user.id;

        if (batch.length < 1000) break;
      }

      return members;
    } catch (error) {
      console.error('Failed to list Discord guild members:', error);
      return [];
    }
  }

  async findMemberByUsername(query: string): Promise<any | null> {
    try {
      const members = await this.listAllGuildMembers();
      const lowerQuery = query.toLowerCase();

      return (
        members.find(
          (m) =>
            m.nick?.toLowerCase().includes(lowerQuery) ||
            m.user.username.toLowerCase().includes(lowerQuery) ||
            m.user.global_name?.toLowerCase().includes(lowerQuery),
        ) || null
      );
    } catch (error) {
      console.error('Failed to find Discord member by username:', error);
      return null;
    }
  }

  async getChannelsByName(name: string): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/guilds/${this.guildId}/channels`,
        {
          headers: {
            Authorization: `Bot ${this.botToken}`,
          },
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          `Failed to get channels: ${error.message || 'Unknown error'}`,
        );
      }

      const channels = await response.json();
      return channels.filter(
        (ch: any) => ch.name.toLowerCase() === name.toLowerCase(),
      );
    } catch (error) {
      console.error('Failed to get Discord channels:', error);
      return [];
    }
  }

  async sendMessageByChannelName(
    channelName: string,
    content: string,
    allChannels?: any[],
    _checkIdempotency: boolean = false,
  ): Promise<{ sent: boolean; skipped: boolean }> {
    try {
      const channels = allChannels
        ? allChannels.filter(
            (ch: any) => ch.name.toLowerCase() === channelName.toLowerCase(),
          )
        : await this.getChannelsByName(channelName);

      if (channels.length === 0) {
        console.warn(`Channel not found: ${channelName}`);
        return { sent: false, skipped: false };
      }

      const channel = channels[0];

      if (!this.sendMessagesEnabled) {
        console.log('[Discord - DRY RUN] Would send message to channel:', {
          channelName,
          channelId: channel.id,
          content,
        });
        return { sent: true, skipped: false };
      }

      await this.sendMessage({
        channelId: channel.id,
        content,
      });
      return { sent: true, skipped: false };
    } catch (error) {
      console.error(`Failed to send message to channel ${channelName}:`, error);
      return { sent: false, skipped: false };
    }
  }

  async getAllGuildChannels(): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/guilds/${this.guildId}/channels`,
        {
          headers: {
            Authorization: `Bot ${this.botToken}`,
          },
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          `Failed to get channels: ${error.message || 'Unknown error'}`,
        );
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get Discord channels:', error);
      return [];
    }
  }
}
