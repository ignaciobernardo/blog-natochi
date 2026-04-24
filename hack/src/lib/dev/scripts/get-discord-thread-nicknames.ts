#!/usr/bin/env node

/**
 * Script to fetch all Discord nicknames from a thread using curl
 * Usage: npx dotenv-cli -e .env.local -- npx tsx src/lib/dev/scripts/get-discord-thread-nicknames.ts
 */

import { execSync } from 'child_process';

const CHANNEL_ID = '1441640326807687318';
const GUILD_ID = '1439366811979223345';
const API_BASE = 'https://discord.com/api/v10';

interface DiscordMessage {
  id: string;
  author: {
    id: string;
    username: string;
    global_name: string | null;
  };
  member?: {
    nick: string | null;
  };
}

interface GuildMember {
  user: {
    id: string;
    username: string;
  };
  nick: string | null;
}

function curlRequest(
  url: string,
  token: string,
): { status: number; body: string } {
  try {
    const response = execSync(
      `curl -s -w "\\n%{http_code}" -H "Authorization: Bot ${token}" -H "Content-Type: application/json" "${url}"`,
      { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 },
    );

    const lines = response.trim().split('\n');
    const httpCode = parseInt(lines[lines.length - 1] || '0', 10);
    const body = lines.slice(0, -1).join('\n');

    return { status: httpCode, body };
  } catch (error) {
    console.error('Curl request failed:', error);
    throw error;
  }
}

async function fetchAllMessages(botToken: string): Promise<DiscordMessage[]> {
  const allMessages: DiscordMessage[] = [];
  let lastMessageId: string | undefined;
  let page = 1;

  console.log('Fetching messages from Discord thread...\n');

  while (true) {
    const url = lastMessageId
      ? `${API_BASE}/channels/${CHANNEL_ID}/messages?limit=100&before=${lastMessageId}`
      : `${API_BASE}/channels/${CHANNEL_ID}/messages?limit=100`;

    console.log(`Fetching page ${page}...`);

    const { status, body } = curlRequest(url, botToken);

    if (status !== 200) {
      throw new Error(`HTTP ${status}: ${body}`);
    }

    const messages: DiscordMessage[] = JSON.parse(body);

    if (messages.length === 0) {
      console.log('No more messages to fetch.');
      break;
    }

    allMessages.push(...messages);
    lastMessageId = messages[messages.length - 1]?.id;

    console.log(
      `  Fetched ${messages.length} messages (total: ${allMessages.length})`,
    );

    if (messages.length < 100) {
      break;
    }

    page++;
    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return allMessages;
}

async function getGuildMemberNickname(
  userId: string,
  botToken: string,
): Promise<string | null> {
  try {
    const url = `${API_BASE}/guilds/${GUILD_ID}/members/${userId}`;
    const { status, body } = curlRequest(url, botToken);

    if (status === 200) {
      const member: GuildMember = JSON.parse(body);
      return member.nick;
    }
    return null;
  } catch {
    return null;
  }
}

async function extractNicknames(
  messages: DiscordMessage[],
  botToken: string,
): Promise<string[]> {
  const seenIds = new Set<string>();
  const nicknames: string[] = [];
  const userIdsNeedingMemberFetch: string[] = [];

  // First pass: collect user IDs that need member info
  for (const message of messages) {
    const authorId = message.author.id;

    if (!seenIds.has(authorId)) {
      seenIds.add(authorId);

      // If member object is present, use its nick
      if (message.member?.nick !== undefined && message.member.nick !== null) {
        nicknames.push(message.member.nick);
      } else {
        // Need to fetch member info from guild
        userIdsNeedingMemberFetch.push(authorId);
      }
    }
  }

  // Second pass: fetch member info for users without member object in message
  console.log(
    `Fetching server nicknames for ${userIdsNeedingMemberFetch.length} users...`,
  );

  for (const userId of userIdsNeedingMemberFetch) {
    const memberNick = await getGuildMemberNickname(userId, botToken);

    if (memberNick) {
      nicknames.push(memberNick);
    } else {
      // Fallback to username if no server nickname
      const message = messages.find((m) => m.author.id === userId);
      if (message) {
        nicknames.push(
          message.author.global_name || message.author.username || 'Unknown',
        );
      }
    }

    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return nicknames.sort();
}

async function main() {
  try {
    const botToken = process.env.DISCORD_BOT_TOKEN;

    if (!botToken) {
      throw new Error('DISCORD_BOT_TOKEN not found in environment variables');
    }

    const messages = await fetchAllMessages(botToken);
    console.log('\nExtracting server nicknames...\n');

    const nicknames = await extractNicknames(messages, botToken);

    console.log('\nServer nicknames (GitHub usernames) that responded:');
    console.log('='.repeat(50));
    nicknames.forEach((nickname) => {
      console.log(nickname);
    });
    console.log('='.repeat(50));
    console.log(`\nTotal unique responders: ${nicknames.length}`);
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
