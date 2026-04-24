import { and, eq } from 'drizzle-orm';
import { DiscordClient } from '@/src/clients/discord';
import { isDevelopmentEnvironment } from '@/src/lib/constants';
import { db } from '@/src/lib/db';
import {
  events,
  hackerProfiles,
  hackers,
  submissions,
} from '@/src/lib/db/schema';
import { getCountryEmoji, getCountryName } from '@/src/lib/utils/countries';

interface ConnectHackerParams {
  hackerProfileId: string;
  code: string;
  githubUsername: string;
  countryCode?: string;
}

interface ConnectHackerResult {
  success: boolean;
  discordId: string;
  discordUsername: string;
}

class DiscordService {
  private client: DiscordClient;
  private isDevelopment: boolean;
  private welcomeChannelId: string;
  private hackerRoleName: string;
  private ph24RoleName: string;

  constructor() {
    this.isDevelopment = isDevelopmentEnvironment;

    const clientId = process.env.DISCORD_CLIENT_ID || '';
    const clientSecret = process.env.DISCORD_CLIENT_SECRET || '';
    const redirectUri = process.env.DISCORD_REDIRECT_URI || '';
    const botToken = process.env.DISCORD_BOT_TOKEN || '';
    const guildId = process.env.DISCORD_GUILD_ID || '';

    this.welcomeChannelId = process.env.DISCORD_WELCOME_CHANNEL_ID || '';
    this.hackerRoleName = process.env.DISCORD_HACKER_ROLE_NAME || 'Hacker';
    this.ph24RoleName = process.env.DISCORD_PH24_ROLE_NAME || 'PH24';

    if (!clientId || !clientSecret || !botToken || !guildId) {
      console.warn('Discord configuration incomplete');
    }

    this.client = new DiscordClient({
      clientId,
      clientSecret,
      redirectUri,
      botToken,
      guildId,
    });
  }

  getOAuthUrl(state?: string): string {
    return this.client.getOAuthUrl(state);
  }

  async connectHacker(
    params: ConnectHackerParams,
  ): Promise<ConnectHackerResult> {
    const { hackerProfileId, code, githubUsername, countryCode } = params;

    try {
      console.log('[Discord] Starting connection flow for:', {
        hackerProfileId,
        githubUsername,
      });

      const tokenResponse = await this.client.exchangeCode(code);
      console.log('[Discord] ✅ Token exchange successful');

      const discordUser = await this.client.getUser(tokenResponse.access_token);
      console.log('[Discord] ✅ User info retrieved:', {
        id: discordUser.id,
        username: discordUser.username,
      });

      await this.client.addGuildMember({
        userId: discordUser.id,
        accessToken: tokenResponse.access_token,
      });
      console.log('[Discord] ✅ User added to guild');

      try {
        await this.client.setNickname({
          userId: discordUser.id,
          nickname: githubUsername,
        });
        console.log('[Discord] ✅ Nickname set to:', githubUsername);
      } catch (error) {
        console.error(
          '[Discord] ❌ Failed to set nickname:',
          error instanceof Error ? error.message : error,
        );
      }

      // Get hackerId and hacker full name from hackerProfileId
      const profileWithHacker = await db
        .select({
          hackerId: hackerProfiles.hackerId,
          fullName: hackers.fullName,
        })
        .from(hackerProfiles)
        .innerJoin(hackers, eq(hackerProfiles.hackerId, hackers.id))
        .where(eq(hackerProfiles.id, hackerProfileId))
        .limit(1);

      const hackerId = profileWithHacker[0]?.hackerId;
      const fullName = profileWithHacker[0]?.fullName || githubUsername;

      // Check if hacker has PH24 RSVP confirmed
      const ph24Profile = hackerId
        ? await db
            .select({
              status: submissions.status,
            })
            .from(hackerProfiles)
            .innerJoin(
              submissions,
              eq(hackerProfiles.submissionId, submissions.id),
            )
            .innerJoin(events, eq(submissions.eventId, events.id))
            .where(
              and(
                eq(hackerProfiles.hackerId, hackerId),
                eq(events.name, 'Platanus Hack 24'),
              ),
            )
            .limit(1)
        : [];

      const hasPH24RsvpConfirmed =
        ph24Profile[0]?.status === 'onboarding_complete';

      console.log('[Discord] PH24 RSVP status:', {
        hasPH24Profile: !!ph24Profile[0],
        status: ph24Profile[0]?.status,
        shouldAddPH24Role: hasPH24RsvpConfirmed,
      });

      // Assign Hacker role
      const hackerRoleId = await this.client.getRoleIdByName(
        this.hackerRoleName,
      );
      if (hackerRoleId) {
        try {
          await this.client.addRole({
            userId: discordUser.id,
            roleId: hackerRoleId,
          });
          console.log('[Discord] ✅ Hacker role assigned');
        } catch (error) {
          console.error(
            '[Discord] ❌ Failed to assign Hacker role:',
            error instanceof Error ? error.message : error,
          );
        }
      } else {
        console.error(
          `[Discord] ❌ Role "${this.hackerRoleName}" not found in guild`,
        );
      }

      // Assign PH24 role if applicable
      if (hasPH24RsvpConfirmed) {
        const ph24RoleId = await this.client.getRoleIdByName(this.ph24RoleName);
        if (ph24RoleId) {
          try {
            await this.client.addRole({
              userId: discordUser.id,
              roleId: ph24RoleId,
            });
            console.log('[Discord] ✅ PH24 role assigned');
          } catch (error) {
            console.error(
              '[Discord] ❌ Failed to assign PH24 role:',
              error instanceof Error ? error.message : error,
            );
          }
        } else {
          console.error(
            `[Discord] ❌ Role "${this.ph24RoleName}" not found in guild`,
          );
        }
      }

      // Assign country role
      if (countryCode) {
        try {
          const emoji = getCountryEmoji(countryCode);
          const countryName = getCountryName(countryCode);
          const countryRoleName = emoji
            ? `${emoji} ${countryName.toLowerCase()}`
            : countryName.toLowerCase();

          console.log('[Discord] Assigning country role:', {
            countryCode,
            roleName: countryRoleName,
          });

          const countryRoleId =
            await this.client.getOrCreateRole(countryRoleName);

          if (countryRoleId) {
            await this.client.addRole({
              userId: discordUser.id,
              roleId: countryRoleId,
            });
            console.log('[Discord] ✅ Country role assigned:', countryRoleName);
          } else {
            console.error(
              `[Discord] ❌ Failed to get or create country role: ${countryRoleName}`,
            );
          }
        } catch (error) {
          console.error(
            '[Discord] ❌ Failed to assign country role:',
            error instanceof Error ? error.message : error,
          );
        }
      }

      const countryFlag = countryCode ? getCountryEmoji(countryCode) : '';
      const welcomeMessage = this.isDevelopment
        ? `🎉 [DEV] Bienvenid@ ${fullName} ${countryFlag} <@${discordUser.id}> a Platanus Hack 25! 🍌🎉`
        : `Bienvenid@ ${fullName} ${countryFlag} <@${discordUser.id}> a Platanus Hack 25! 🍌🎉`;

      try {
        await this.client.sendMessage({
          channelId: this.welcomeChannelId,
          content: welcomeMessage,
        });
        console.log('[Discord] ✅ Welcome message sent');
      } catch (error) {
        console.error(
          '[Discord] ❌ Failed to send welcome message:',
          error instanceof Error ? error.message : error,
        );
      }

      await db
        .update(hackerProfiles)
        .set({
          discordId: discordUser.id,
          discordUsername: discordUser.username,
          discordConnectedAt: new Date(),
        })
        .where(eq(hackerProfiles.id, hackerProfileId));

      return {
        success: true,
        discordId: discordUser.id,
        discordUsername: discordUser.username,
      };
    } catch (error) {
      console.error('Failed to connect Discord for hacker:', {
        hackerProfileId,
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  async disconnectHacker(hackerProfileId: string): Promise<void> {
    try {
      await db
        .update(hackerProfiles)
        .set({
          discordId: null,
          discordUsername: null,
          discordConnectedAt: null,
        })
        .where(eq(hackerProfiles.id, hackerProfileId));
    } catch (error) {
      console.error('Failed to disconnect Discord for hacker:', {
        hackerProfileId,
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  async sendBulkReminderMessages(
    teamSlugs: string[],
    messageOrGenerator: string | ((slug: string, roleId?: string) => string),
  ): Promise<{ sent: number; failed: number; skipped: number }> {
    let sent = 0;
    let failed = 0;
    let skipped = 0;

    // Fetch all channels and roles once to avoid rate limiting
    const allChannels = await this.client.getAllGuildChannels();
    const allRoles = await this.client.getGuildRoles();
    const roleMap = new Map(allRoles.map((r) => [r.name.toLowerCase(), r.id]));

    // Discord has rate limits, send with 100ms delay between messages to be safe
    for (const slug of teamSlugs) {
      // Get role ID from cached map
      const roleId = roleMap.get(slug.toLowerCase());

      const message =
        typeof messageOrGenerator === 'function'
          ? messageOrGenerator(slug, roleId || undefined)
          : messageOrGenerator;
      const result = await this.client.sendMessageByChannelName(
        slug,
        message,
        allChannels,
        false,
      );
      if (result.sent) {
        sent++;
      } else if (result.skipped) {
        skipped++;
      } else {
        failed++;
      }
      // Rate limiting: wait 100ms between messages (Discord limit is 50 requests/second)
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return { sent, failed, skipped };
  }
}

export const discordService = new DiscordService();
