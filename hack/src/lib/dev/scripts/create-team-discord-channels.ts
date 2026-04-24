import { eq } from 'drizzle-orm';
import { DiscordClient } from '@/src/clients/discord';
import { db } from '@/src/lib/db';
import { events } from '@/src/lib/db/schema';
import { getAllTeams } from '@/src/queries/teams';

const DRY_RUN = process.env.DRY_RUN === 'true';

interface DiscordChannel {
  id: string;
  name: string;
  type: number;
}

interface PermissionOverwrite {
  id: string;
  type: 0 | 1; // 0 = role, 1 = member
  allow: string;
  deny: string;
}

interface CreateChannelParams {
  name: string;
  type?: number; // 0 = text, 2 = voice, 4 = category
  permissionOverwrites?: PermissionOverwrite[];
  topic?: string; // Channel topic/description
}

const CHANNEL_TYPE_TEXT = 0;
const CHANNEL_TYPE_VOICE = 2;

async function createChannel(
  _client: DiscordClient,
  guildId: string,
  botToken: string,
  params: CreateChannelParams,
): Promise<DiscordChannel | null> {
  try {
    const response = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/channels`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bot ${botToken}`,
        },
        body: JSON.stringify({
          name: params.name,
          type: params.type || 0,
          permission_overwrites: params.permissionOverwrites || [],
          topic: params.topic,
        }),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `Failed to create channel: ${error.message || 'Unknown error'}`,
      );
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to create Discord channel:', {
      name: params.name,
      error: error instanceof Error ? error.message : error,
    });
    return null;
  }
}

function normalizeGithubUrl(githubUrl: string): string {
  // Extract username from GitHub URL or return as-is if it's already just a username
  const match = githubUrl.match(/github\.com\/([^/]+)/);
  return match ? match[1] : githubUrl;
}

function findMentorInMembers(
  members: any[],
  mentorGithub: string,
): { username: string | null; userId: string | null; matchedVia: string } {
  const normalizedMentorGithub = normalizeGithubUrl(mentorGithub);
  const lowerQuery = normalizedMentorGithub.toLowerCase();

  const member = members.find(
    (m) =>
      m.nick?.toLowerCase().includes(lowerQuery) ||
      m.user.username.toLowerCase().includes(lowerQuery) ||
      m.user.global_name?.toLowerCase().includes(lowerQuery),
  );

  if (member) {
    return {
      username: member.nick || member.user.username,
      userId: member.user.id,
      matchedVia: 'discord-nickname',
    };
  }

  return { username: null, userId: null, matchedVia: 'not-found' };
}

async function main() {
  console.log('='.repeat(80));
  console.log('Create Team Discord Channels');
  console.log('='.repeat(80));
  console.log('');

  if (DRY_RUN) {
    console.log('🔍 DRY RUN MODE - No channels will be created');
    console.log('');
  }

  const client = new DiscordClient({
    clientId: process.env.DISCORD_CLIENT_ID || '',
    clientSecret: process.env.DISCORD_CLIENT_SECRET || '',
    redirectUri: process.env.DISCORD_REDIRECT_URI || '',
    botToken: process.env.DISCORD_BOT_TOKEN || '',
    guildId: process.env.DISCORD_GUILD_ID || '',
  });

  const botToken = process.env.DISCORD_BOT_TOKEN || '';
  const guildId = process.env.DISCORD_GUILD_ID || '';

  // Get current event (Platanus Hack 25)
  const [currentEvent] = await db
    .select()
    .from(events)
    .where(eq(events.name, 'Platanus Hack 25'))
    .limit(1);

  if (!currentEvent) {
    console.error('❌ Event "Platanus Hack 25" not found in database');
    process.exit(1);
  }

  console.log(`Event: ${currentEvent.name} (ID: ${currentEvent.id})`);
  console.log('');

  // Get staff role ID
  const staffRoleId = await client.getRoleIdByName('staff');
  if (!staffRoleId) {
    console.error('❌ Staff role not found in Discord server');
    process.exit(1);
  }
  console.log(`Staff Role ID: ${staffRoleId}`);

  // Get @everyone role ID (guild ID is the @everyone role ID)
  const everyoneRoleId = guildId;
  console.log(`@everyone Role ID: ${everyoneRoleId}`);

  // Frank bot user ID
  const FRANK_BOT_ID = '1439373728310886440';
  console.log(`Frank Bot ID: ${FRANK_BOT_ID}`);
  console.log('');

  console.log('='.repeat(80));
  console.log('');

  // Fetch all Discord members once to avoid rate limits
  console.log('Fetching all Discord members...');
  const allMembers = await client.listAllGuildMembers();
  console.log(`Found ${allMembers.length} Discord members`);
  console.log('');

  // Get all teams
  const teams = await getAllTeams(currentEvent.id);
  console.log(`Found ${teams.length} teams`);
  console.log('');

  // Get team role IDs for filtered teams only
  console.log('Looking up team role IDs...');
  const teamRoleMap = new Map<string, string>();
  for (const team of teams) {
    const roleId = await client.getRoleIdByName(team.slug);
    if (roleId) {
      teamRoleMap.set(team.slug, roleId);
    } else {
      console.log(
        `  ⚠️  Team role "${team.slug}" not found - internal channels won't have team permissions`,
      );
    }
  }
  console.log(`Found ${teamRoleMap.size} team roles`);
  console.log('');

  let channelsToCreate = 0;
  let channelsCreated = 0;
  let channelsFailed = 0;

  for (const team of teams) {
    console.log(`Team: ${team.slug}`);
    console.log('-'.repeat(80));

    const channelConfigs: Array<{
      name: string;
      description: string;
      permissions: PermissionOverwrite[];
      type: number;
      mentorUsername?: string;
    }> = [];

    // Get team role ID for this team
    const teamRoleId = teamRoleMap.get(team.slug);

    // Channel 1: <team-slug> - Official communication channel (private)
    const publicChannelPerms: PermissionOverwrite[] = [];
    if (teamRoleId) {
      // Allow team role to view and send messages
      publicChannelPerms.push({
        id: teamRoleId,
        type: 0, // role
        allow: '3072', // VIEW_CHANNEL + SEND_MESSAGES
        deny: '0',
      });
    }
    publicChannelPerms.push(
      {
        id: staffRoleId,
        type: 0, // role
        allow: '3072', // VIEW_CHANNEL + SEND_MESSAGES
        deny: '0',
      },
      {
        id: FRANK_BOT_ID,
        type: 1, // member
        allow: '3072', // VIEW_CHANNEL + SEND_MESSAGES
        deny: '0',
      },
      // Deny @everyone access to make channel private
      {
        id: everyoneRoleId,
        type: 0, // role
        allow: '0',
        deny: '1024', // Deny VIEW_CHANNEL
      },
    );

    channelConfigs.push({
      name: team.slug,
      description: `El canal oficial de comunicación entre ${team.slug} y Platanus Hack 25`,
      permissions: publicChannelPerms,
      type: CHANNEL_TYPE_TEXT,
    });

    // Channel 2: <team-slug>-interno - Internal team text channel
    const internalTextPerms: PermissionOverwrite[] = [];
    if (teamRoleId) {
      // Allow team role to view and send messages
      internalTextPerms.push({
        id: teamRoleId,
        type: 0, // role
        allow: '3072', // VIEW_CHANNEL + SEND_MESSAGES
        deny: '0',
      });
    }
    // Deny @everyone access
    internalTextPerms.push({
      id: everyoneRoleId,
      type: 0, // role
      allow: '0',
      deny: '1024', // Deny VIEW_CHANNEL
    });

    channelConfigs.push({
      name: `${team.slug}-interno`,
      description: 'Un canal solo para ustedes',
      permissions: internalTextPerms,
      type: CHANNEL_TYPE_TEXT,
    });

    // Channel 3: <slug>-interno-voz - Internal team voice channel
    const internalVoicePerms: PermissionOverwrite[] = [];
    if (teamRoleId) {
      // Allow team role to view and connect to voice channel
      internalVoicePerms.push({
        id: teamRoleId,
        type: 0, // role
        allow: '1049600', // VIEW_CHANNEL (1024) + CONNECT (1048576) = 1049600
        deny: '0',
      });
    }
    // Deny @everyone access
    internalVoicePerms.push({
      id: everyoneRoleId,
      type: 0, // role
      allow: '0',
      deny: '1024', // Deny VIEW_CHANNEL
    });

    channelConfigs.push({
      name: `${team.slug}-interno-voz`,
      description: 'Un canal solo para ustedes',
      permissions: internalVoicePerms,
      type: CHANNEL_TYPE_VOICE,
    });

    // Channel 4: <team-slug>-mentor - Mentor channel
    let mentorDiscordInfo: {
      username: string | null;
      userId: string | null;
      matchedVia: string;
    } = {
      username: null,
      userId: null,
      matchedVia: 'no-mentor',
    };
    if (team.mentor) {
      mentorDiscordInfo = findMentorInMembers(allMembers, team.mentor.github);
    }

    const mentorChannelPerms: PermissionOverwrite[] = [];
    if (teamRoleId) {
      // Allow team role to view and send messages
      mentorChannelPerms.push({
        id: teamRoleId,
        type: 0, // role
        allow: '3072', // VIEW_CHANNEL + SEND_MESSAGES
        deny: '0',
      });
    }
    // Add mentor permissions if found
    if (mentorDiscordInfo.userId) {
      mentorChannelPerms.push({
        id: mentorDiscordInfo.userId,
        type: 1, // member
        allow: '3072', // VIEW_CHANNEL + SEND_MESSAGES
        deny: '0',
      });
    }
    // Deny @everyone access
    mentorChannelPerms.push({
      id: everyoneRoleId,
      type: 0, // role
      allow: '0',
      deny: '1024', // Deny VIEW_CHANNEL
    });

    const mentorDescription = team.mentor
      ? mentorDiscordInfo.username
        ? `Tu equipo + tu mentor`
        : `Tu equipo + tu mentor (mentor: ${team.mentor.fullName} [@${team.mentor.github}] - not found in Discord)`
      : 'Tu equipo + tu mentor (no mentor assigned)';

    channelConfigs.push({
      name: `${team.slug}-mentor`,
      description: mentorDescription,
      permissions: mentorChannelPerms,
      type: CHANNEL_TYPE_TEXT,
      mentorUsername: mentorDiscordInfo.username || undefined,
    });

    // Log what would be created
    for (const config of channelConfigs) {
      channelsToCreate++;
      const channelTypeLabel = config.type === CHANNEL_TYPE_VOICE ? '🔊' : '#';
      console.log(`  - ${channelTypeLabel}${config.name}`);
      console.log(`    ${config.description}`);
      console.log(
        `    Type: ${config.type === CHANNEL_TYPE_VOICE ? 'Voice' : 'Text'}`,
      );

      if (config.permissions.length > 0) {
        console.log(`    Permissions: ${config.permissions.length} overwrites`);
        for (const perm of config.permissions) {
          const permType = perm.type === 0 ? 'role' : 'member';
          console.log(
            `      - ${permType} ${perm.id}: allow=${perm.allow}, deny=${perm.deny}`,
          );
        }
      }

      if (DRY_RUN) {
        console.log('    [DRY RUN] Would create this channel');
        if (config.description) {
          console.log(`    Topic: ${config.description}`);
        }
      } else {
        const channel = await createChannel(client, guildId, botToken, {
          name: config.name,
          type: config.type,
          permissionOverwrites: config.permissions,
          // Voice channels don't support topics
          topic:
            config.type === CHANNEL_TYPE_VOICE ? undefined : config.description,
        });

        if (channel) {
          console.log(`    ✅ Created: ${channel.id}`);
          channelsCreated++;
        } else {
          console.log('    ❌ Failed to create');
          channelsFailed++;
        }
      }
    }

    console.log('');
  }

  console.log('='.repeat(80));
  console.log('Summary');
  console.log('='.repeat(80));
  console.log(`Teams processed: ${teams.length}`);
  console.log(`Channels to create: ${channelsToCreate}`);

  if (!DRY_RUN) {
    console.log(`Channels created: ${channelsCreated}`);
    console.log(`Channels failed: ${channelsFailed}`);
  }

  console.log('');
  console.log('✅ Script completed');
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('');
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
