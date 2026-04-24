#!/usr/bin/env node

/**
 * Script to get hackers' Anthropic data from Discord thread GitHub usernames
 * Usage: npx dotenv-cli -e .env.local -- npx tsx src/lib/dev/scripts/get-hackers-anthropic-data.ts
 */

import { execSync } from 'child_process';
import { eq, or, sql } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import { hackerProfiles, hackers } from '@/src/lib/db/schema';

const CHANNEL_ID = '1441640326807687318';
const GUILD_ID = '1439366811979223345';
const API_BASE = 'https://discord.com/api/v10';

interface DiscordMessage {
  id: string;
  timestamp: string;
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

    const rawMessages: any[] = JSON.parse(body);
    const messages: DiscordMessage[] = rawMessages.map((msg) => ({
      ...msg,
      timestamp:
        msg.timestamp ||
        new Date(
          msg.id ? (BigInt(msg.id) >> 22n) + 1420070400000n : Date.now(),
        ).toString(),
    }));

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

interface UsernameWithTimestamp {
  username: string;
  messageTimestamp: Date;
}

async function extractGitHubUsernames(
  messages: DiscordMessage[],
  botToken: string,
): Promise<UsernameWithTimestamp[]> {
  const seenIds = new Set<string>();
  const usernames: UsernameWithTimestamp[] = [];
  const userIdsNeedingMemberFetch: Array<{
    userId: string;
    message: DiscordMessage;
  }> = [];

  for (const message of messages) {
    const authorId = message.author.id;

    if (!seenIds.has(authorId)) {
      seenIds.add(authorId);

      // Parse Discord timestamp (ISO string or Snowflake ID)
      let messageTime: Date;
      if (message.timestamp) {
        messageTime = new Date(message.timestamp);
      } else {
        // Fallback: extract timestamp from Snowflake ID
        const snowflake = BigInt(message.id);
        const timestamp = Number(snowflake >> 22n) + 1420070400000;
        messageTime = new Date(timestamp);
      }

      if (message.member?.nick !== undefined && message.member.nick !== null) {
        usernames.push({
          username: message.member.nick,
          messageTimestamp: messageTime,
        });
      } else {
        userIdsNeedingMemberFetch.push({ userId: authorId, message });
      }
    }
  }

  console.log(
    `Fetching server nicknames for ${userIdsNeedingMemberFetch.length} users...`,
  );

  for (const { userId, message } of userIdsNeedingMemberFetch) {
    const memberNick = await getGuildMemberNickname(userId, botToken);

    let messageTime: Date;
    if (message.timestamp) {
      messageTime = new Date(message.timestamp);
    } else {
      const snowflake = BigInt(message.id);
      const timestamp = Number(snowflake >> 22n) + 1420070400000;
      messageTime = new Date(timestamp);
    }

    if (memberNick) {
      usernames.push({
        username: memberNick,
        messageTimestamp: messageTime,
      });
    } else {
      usernames.push({
        username:
          message.author.global_name || message.author.username || 'Unknown',
        messageTimestamp: messageTime,
      });
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return usernames;
}

interface HackerData {
  githubUsername: string;
  anthropicAccountEmail: string | null;
  anthropicOrgId: string | null;
  anthropicInfoSentAt: Date | null;
  discordMessageTime: Date;
}

async function findHackersByGitHubUsernames(
  usernamesWithTimestamps: UsernameWithTimestamp[],
): Promise<HackerData[]> {
  console.log(
    `\nQuerying database for ${usernamesWithTimestamps.length} GitHub usernames...\n`,
  );

  const results: HackerData[] = [];

  for (const { username, messageTimestamp } of usernamesWithTimestamps) {
    // Match GitHub field that could be:
    // - Just username: "username"
    // - Full URL: "https://github.com/username"
    // - URL without protocol: "github.com/username"
    // Use case-insensitive matching
    const _usernameLower = username.toLowerCase();

    const hackerData = await db
      .select({
        githubUsername: hackers.github,
        anthropicAccountEmail: hackerProfiles.anthropicAccountEmail,
        anthropicOrgId: hackerProfiles.anthropicOrgId,
        anthropicInfoSentAt: hackerProfiles.anthropicInfoSentAt,
      })
      .from(hackers)
      .innerJoin(hackerProfiles, eq(hackerProfiles.hackerId, hackers.id))
      .where(
        or(
          sql`LOWER(${hackers.github}) = LOWER(${username})`,
          sql`LOWER(${hackers.github}) LIKE LOWER(${`%/${username}`})`,
          sql`LOWER(${hackers.github}) LIKE LOWER(${`%/${username}%`})`,
          sql`LOWER(${hackers.github}) LIKE LOWER(${`%${username}%`})`,
        ),
      )
      .limit(1);

    if (hackerData.length > 0) {
      const data = hackerData[0];
      results.push({
        githubUsername: username,
        anthropicAccountEmail: data.anthropicAccountEmail,
        anthropicOrgId: data.anthropicOrgId,
        anthropicInfoSentAt: data.anthropicInfoSentAt,
        discordMessageTime: messageTimestamp,
      });
    } else {
      // Not found, still add to results with null values
      results.push({
        githubUsername: username,
        anthropicAccountEmail: null,
        anthropicOrgId: null,
        anthropicInfoSentAt: null,
        discordMessageTime: messageTimestamp,
      });
    }
  }

  return results;
}

function formatChileanDateTime(date: Date | null): string {
  if (!date) return '';

  // Format date in Chilean timezone (America/Santiago)
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Santiago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const year = parts.find((p) => p.type === 'year')?.value || '';
  const month = parts.find((p) => p.type === 'month')?.value || '';
  const day = parts.find((p) => p.type === 'day')?.value || '';
  const hour = parts.find((p) => p.type === 'hour')?.value || '';
  const minute = parts.find((p) => p.type === 'minute')?.value || '';
  const second = parts.find((p) => p.type === 'second')?.value || '';

  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

function escapeCsvField(field: string | null): string {
  if (field === null || field === undefined) return '';

  // If field contains comma, quote, or newline, wrap in quotes and escape quotes
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }

  return field;
}

function generateCSV(data: HackerData[]): string {
  const headers = [
    'Anthropic Account Email',
    'Anthropic Org ID',
    'Anthropic Upload Date',
    'Report Time',
  ];

  // Keep the order as messages appeared in thread (no sorting)
  const rows = data
    .filter(
      (row) =>
        row.anthropicAccountEmail ||
        row.anthropicOrgId ||
        row.anthropicInfoSentAt,
    )
    .map((row) => [
      escapeCsvField(row.anthropicAccountEmail),
      escapeCsvField(row.anthropicOrgId),
      escapeCsvField(formatChileanDateTime(row.anthropicInfoSentAt)),
      escapeCsvField(formatChileanDateTime(row.discordMessageTime)),
    ]);

  const csvRows = [headers.join(','), ...rows.map((row) => row.join(','))];
  return csvRows.join('\n');
}

async function main() {
  try {
    const botToken = process.env.DISCORD_BOT_TOKEN;

    if (!botToken) {
      throw new Error('DISCORD_BOT_TOKEN not found in environment variables');
    }

    // Step 1: Get GitHub usernames from Discord thread
    const messages = await fetchAllMessages(botToken);
    console.log('\nExtracting server nicknames...\n');
    const usernamesWithTimestamps = await extractGitHubUsernames(
      messages,
      botToken,
    );

    console.log(`Found ${usernamesWithTimestamps.length} GitHub usernames\n`);

    // Step 2: Query hackers by GitHub username (preserving thread order)
    const hackerData = await findHackersByGitHubUsernames(
      usernamesWithTimestamps,
    );

    // Step 3: Generate CSV
    const csv = generateCSV(hackerData);

    // Step 4: Output results
    console.log('='.repeat(80));
    console.log('CSV Output:');
    console.log('='.repeat(80));
    console.log(csv);
    console.log('='.repeat(80));

    const foundCount = hackerData.filter(
      (h) => h.anthropicInfoSentAt !== null,
    ).length;
    const notFoundCount = hackerData.filter(
      (h) => h.anthropicInfoSentAt === null,
    ).length;

    console.log(`\nSummary:`);
    console.log(`  Total GitHub usernames: ${usernamesWithTimestamps.length}`);
    console.log(`  Hackers found: ${foundCount}`);
    console.log(`  Hackers not found: ${notFoundCount}`);
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
