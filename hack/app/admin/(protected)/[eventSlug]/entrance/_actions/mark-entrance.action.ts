'use server';

import { DiscordClient } from '@/src/clients/discord';
import { revalidateAdminEventPathByEventId } from '@/src/lib/admin/revalidate';
import { onlyAdmin } from '@/src/lib/auth/server';
import { isDevelopmentEnvironment } from '@/src/lib/constants';
import {
  type MarkEntranceData,
  markEntranceSchema,
} from '@/src/lib/schemas/entrance.schema';
import {
  type FormActionState,
  handleCommonError,
  isCommonError,
} from '@/src/lib/utils/forms';
import {
  getHackerEntranceInfo,
  getMentorEntranceInfo,
  markHackerEntrance,
  markMentorEntrance,
} from '@/src/queries/entrances';

function extractGithubUsername(github: string): string {
  return github
    .replace(/^https?:\/\/(www\.)?github\.com\//, '')
    .replace(/\/$/, '')
    .split('/')[0];
}

async function findDiscordIdByGithubUsername(
  discordClient: DiscordClient,
  githubUsername: string,
): Promise<string | null> {
  try {
    const member = await discordClient.findMemberByUsername(githubUsername);
    return member?.user?.id || null;
  } catch (error) {
    console.error('[Entrance] Failed to search Discord members:', error);
    return null;
  }
}

async function sendEntranceDiscordMessage(
  github: string | null,
  discordId: string | null,
  personType: 'hacker' | 'mentor',
) {
  const welcomeChannelId = process.env.DISCORD_WELCOME_CHANNEL_ID;
  if (!welcomeChannelId) {
    console.warn('[Entrance] No DISCORD_WELCOME_CHANNEL_ID configured');
    return;
  }

  const discordClient = new DiscordClient({
    clientId: process.env.DISCORD_CLIENT_ID || '',
    clientSecret: process.env.DISCORD_CLIENT_SECRET || '',
    redirectUri: process.env.DISCORD_REDIRECT_URI || '',
    botToken: process.env.DISCORD_BOT_TOKEN || '',
    guildId: process.env.DISCORD_GUILD_ID || '',
  });

  let resolvedDiscordId = discordId;

  if (!resolvedDiscordId && github && personType === 'mentor') {
    const githubUsername = extractGithubUsername(github);
    resolvedDiscordId = await findDiscordIdByGithubUsername(
      discordClient,
      githubUsername,
    );
  }

  const githubDisplay = github ? extractGithubUsername(github) : 'Participant';
  const mention = resolvedDiscordId ? `<@${resolvedDiscordId}>` : githubDisplay;

  const message = isDevelopmentEnvironment
    ? `🎉 [DEV] ${mention} llegó a Platanus Hack 25! 🍌`
    : `🎉 ${mention} llegó a Platanus Hack 25! 🍌`;

  try {
    await discordClient.sendMessage({
      channelId: welcomeChannelId,
      content: message,
    });
    console.log('[Entrance] Discord message sent successfully');
  } catch (error) {
    console.error('[Entrance] Failed to send Discord message:', error);
  }
}

export async function markEntranceAction(
  data: MarkEntranceData,
): Promise<FormActionState<MarkEntranceData>> {
  try {
    const adminUser = await onlyAdmin();

    if (!adminUser.linkedId) {
      return {
        success: false,
        globalError: 'Admin not linked to database',
      };
    }

    const validatedData = markEntranceSchema.parse(data);

    let personInfo: {
      fullName: string;
      github: string | null;
      discordId?: string | null;
    } | null = null;

    if (validatedData.personType === 'hacker') {
      await markHackerEntrance({
        eventId: validatedData.eventId,
        hackerId: validatedData.personId,
        adminId: adminUser.linkedId,
      });
      personInfo = await getHackerEntranceInfo(validatedData.personId);
    } else {
      personInfo = await getMentorEntranceInfo(
        validatedData.personId,
        validatedData.eventId,
      );

      if (!personInfo) {
        return {
          success: false,
          globalError: 'Mentor not found for this event',
        };
      }

      await markMentorEntrance({
        eventId: validatedData.eventId,
        mentorId: validatedData.personId,
        adminId: adminUser.linkedId,
      });
    }

    if (personInfo) {
      await sendEntranceDiscordMessage(
        personInfo.github,
        personInfo.discordId || null,
        validatedData.personType,
      );
    }

    await revalidateAdminEventPathByEventId(validatedData.eventId, 'entrance');

    return {
      success: true,
      data: validatedData,
      message: `${personInfo?.fullName || 'Participant'} marked as entered!`,
    };
  } catch (error) {
    if (isCommonError(error)) {
      return handleCommonError<MarkEntranceData>(error);
    }

    console.error('Mark entrance error:', error);

    if (
      error instanceof Error &&
      error.message.includes('duplicate key value')
    ) {
      return {
        success: false,
        globalError: 'This person has already entered the event.',
      };
    }

    return {
      success: false,
      globalError:
        error instanceof Error
          ? error.message
          : 'Failed to mark entrance. Please try again.',
    };
  }
}
