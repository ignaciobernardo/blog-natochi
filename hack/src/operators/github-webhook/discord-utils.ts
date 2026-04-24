import { DiscordClient } from '@/src/clients/discord';
import { isDevelopmentEnvironment } from '@/src/lib/constants';

export async function sendTeamDiscordMessage(
  teamSlug: string,
  message: string,
): Promise<void> {
  const clientId = process.env.DISCORD_CLIENT_ID || '';
  const clientSecret = process.env.DISCORD_CLIENT_SECRET || '';
  const redirectUri = process.env.DISCORD_REDIRECT_URI || '';
  const botToken = process.env.DISCORD_BOT_TOKEN || '';
  const guildId = process.env.DISCORD_GUILD_ID || '';

  const discordClient = new DiscordClient({
    clientId,
    clientSecret,
    redirectUri,
    botToken,
    guildId,
  });

  let channelId: string;

  if (isDevelopmentEnvironment) {
    const devChannelId = process.env.DISCORD_DEVELOPMENT_TEAM_CHANNEL_ID;
    if (devChannelId) {
      console.log(
        `[Development] Using development channel for team: ${teamSlug}`,
      );
      channelId = devChannelId;
      message = `**[DEV - Team: ${teamSlug}]**\n\n${message}`;
    } else {
      console.warn(
        '[Development] DISCORD_DEVELOPMENT_TEAM_CHANNEL_ID not set, falling back to channel lookup',
      );
      const channels = await discordClient.getChannelsByName(teamSlug);
      if (channels.length === 0) {
        console.error(`Discord channel not found for team: ${teamSlug}`);
        throw new Error(`Discord channel not found for team: ${teamSlug}`);
      }
      channelId = channels[0].id;
    }
  } else {
    const channels = await discordClient.getChannelsByName(teamSlug);
    if (channels.length === 0) {
      console.error(`Discord channel not found for team: ${teamSlug}`);
      throw new Error(`Discord channel not found for team: ${teamSlug}`);
    }
    channelId = channels[0].id;
  }

  await discordClient.sendMessage({
    channelId,
    content: message,
  });
}
