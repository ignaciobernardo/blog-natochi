#!/usr/bin/env node

/**
 * Script to assign Discord roles to hackers based on their team and track
 *
 * This script:
 * 1. Creates/get Discord roles for each team slug (e.g., "team-slug")
 * 2. Creates/get Discord roles for each track with emoji prefixes:
 *    - ✨consumer-ai
 *    - ☎️ legacy
 *    - 💪human-enhancement
 *    - 🛡️ fintech-digital-security
 * 3. Assigns team role and track role to each hacker based on their team membership
 *
 * Usage:
 *   Dry run: DRY_RUN=true npx dotenv-cli -e .env.local -- npx tsx src/lib/dev/scripts/assign-discord-roles.ts
 *   Execute: npx dotenv-cli -e .env.local -- npx tsx src/lib/dev/scripts/assign-discord-roles.ts
 */

import { and, eq, isNotNull } from 'drizzle-orm';
import { DiscordClient } from '@/src/clients/discord';
import { db } from '@/src/lib/db';
import {
  events,
  hackerProfiles,
  hackers,
  submissions,
  teams,
  tracks,
} from '@/src/lib/db/schema';

const DRY_RUN = process.env.DRY_RUN === 'true';

// Track name mapping: database name -> emoji-prefixed Discord role name
// Database tracks:
// - "✨ consumer AI" -> "✨consumer-ai"
// - "☎️ legacy" -> "☎️ legacy"
// - "🦾 human enhancement" -> "💪human-enhancement"
// - "🛡️ fintech + digital security" -> "🛡️ fintech-digital-security"
const TRACK_ROLE_MAP: Record<string, string> = {
  '✨ consumer ai': '✨consumer-ai',
  '☎️ legacy': '☎️ legacy',
  '🦾 human enhancement': '💪human-enhancement',
  '🛡️ fintech + digital security': '🛡️ fintech-digital-security',
};

function extractGitHubUsername(github: string | null): string | null {
  if (!github) return null;
  // Extract username from GitHub URL or return as-is if it's already just a username
  const match = github.match(/github\.com\/([^/]+)/);
  return match ? match[1] : github;
}

interface HackerWithRoles {
  hackerId: string;
  discordId: string | null;
  fullName: string;
  github: string | null;
  teamSlug: string | null;
  trackName: string | null;
  trackRoleName: string | null;
}

async function getAllHackersWithRoles(
  eventId: string,
): Promise<HackerWithRoles[]> {
  return await db
    .select({
      hackerId: hackers.id,
      discordId: hackerProfiles.discordId,
      fullName: hackers.fullName,
      github: hackers.github,
      teamSlug: teams.slug,
      trackName: tracks.name,
    })
    .from(hackerProfiles)
    .innerJoin(hackers, eq(hackerProfiles.hackerId, hackers.id))
    .innerJoin(submissions, eq(hackerProfiles.submissionId, submissions.id))
    .leftJoin(teams, eq(hackerProfiles.teamId, teams.id))
    .leftJoin(tracks, eq(teams.trackId, tracks.id))
    .where(
      and(
        isNotNull(hackerProfiles.discordId),
        eq(submissions.eventId, eventId),
      ),
    )
    .then((rows) =>
      rows.map((row) => ({
        ...row,
        discordId: row.discordId || null,
        github: extractGitHubUsername(row.github),
        teamSlug: row.teamSlug || null,
        trackName: row.trackName || null,
        trackRoleName: row.trackName
          ? TRACK_ROLE_MAP[row.trackName] ||
            TRACK_ROLE_MAP[row.trackName.toLowerCase()] ||
            null
          : null,
      })),
    );
}

async function main() {
  console.log('='.repeat(80));
  console.log('Assign Discord Roles to Hackers');
  console.log('='.repeat(80));
  console.log('');

  if (DRY_RUN) {
    console.log('🔍 DRY RUN MODE - No roles will be created or assigned');
    console.log('');
  }

  const client = new DiscordClient({
    clientId: process.env.DISCORD_CLIENT_ID || '',
    clientSecret: process.env.DISCORD_CLIENT_SECRET || '',
    redirectUri: process.env.DISCORD_REDIRECT_URI || '',
    botToken: process.env.DISCORD_BOT_TOKEN || '',
    guildId: process.env.DISCORD_GUILD_ID || '',
  });

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

  // Get all hackers with their team and track info
  console.log('Fetching hackers with team and track info...');
  const hackersWithRoles = await getAllHackersWithRoles(currentEvent.id);
  console.log(`Found ${hackersWithRoles.length} hackers with Discord IDs`);
  console.log('');

  // Collect unique team slugs and track role names
  const teamSlugs = new Set<string>();
  const trackRoleNames = new Set<string>();
  const trackNamesFound = new Set<string>();

  for (const hacker of hackersWithRoles) {
    if (hacker.teamSlug) {
      teamSlugs.add(hacker.teamSlug);
    }
    if (hacker.trackName) {
      trackNamesFound.add(hacker.trackName);
    }
    if (hacker.trackRoleName) {
      trackRoleNames.add(hacker.trackRoleName);
    }
  }

  console.log(`Found ${teamSlugs.size} unique teams`);
  console.log(`Found ${trackNamesFound.size} unique track names in database`);
  if (trackNamesFound.size > 0) {
    console.log(`  Track names: ${Array.from(trackNamesFound).join(', ')}`);
  }
  console.log(`Found ${trackRoleNames.size} unique track roles`);
  if (trackRoleNames.size > 0) {
    console.log(`  Track roles: ${Array.from(trackRoleNames).join(', ')}`);
  }
  console.log('');

  // Look up existing role IDs (roles already exist, just get their IDs)
  console.log('Looking up existing role IDs...');
  console.log('');

  const teamRoleMap = new Map<string, string>();

  for (const teamSlug of Array.from(teamSlugs).sort()) {
    if (DRY_RUN) {
      teamRoleMap.set(teamSlug, 'dry-run-role-id');
    } else {
      const roleId = await client.getRoleIdByName(teamSlug);
      if (roleId) {
        teamRoleMap.set(teamSlug, roleId);
      } else {
        console.log(`  ⚠️  Team role "${teamSlug}" not found, skipping`);
      }
    }
  }

  const trackRoleMap = new Map<string, string>();

  for (const trackRoleName of Array.from(trackRoleNames).sort()) {
    if (DRY_RUN) {
      trackRoleMap.set(trackRoleName, 'dry-run-role-id');
    } else {
      const roleId = await client.getRoleIdByName(trackRoleName);
      if (roleId) {
        trackRoleMap.set(trackRoleName, roleId);
      } else {
        console.log(`  ⚠️  Track role "${trackRoleName}" not found, skipping`);
      }
    }
  }

  console.log(`Found ${teamRoleMap.size} team roles`);
  console.log(`Found ${trackRoleMap.size} track roles`);
  console.log('');

  // Assign roles to hackers
  console.log('='.repeat(80));
  console.log('Assigning Roles to Hackers');
  console.log('='.repeat(80));
  console.log('');

  let assignedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  for (const hacker of hackersWithRoles) {
    const rolesToAssign: Array<{ id: string; name: string }> = [];

    // Add team role if hacker has a team
    if (hacker.teamSlug) {
      const teamRoleId = teamRoleMap.get(hacker.teamSlug);
      if (teamRoleId) {
        rolesToAssign.push({
          id: teamRoleId,
          name: hacker.teamSlug,
        });
      }
    }

    // Add track role if hacker has a track
    if (hacker.trackRoleName) {
      const trackRoleId = trackRoleMap.get(hacker.trackRoleName);
      if (trackRoleId) {
        rolesToAssign.push({
          id: trackRoleId,
          name: hacker.trackRoleName,
        });
      }
    }

    if (rolesToAssign.length === 0) {
      console.log(
        `⏭️  Skipping ${hacker.fullName} (${hacker.github || 'no-github'}) - no roles to assign`,
      );
      if (hacker.teamSlug) {
        console.log(`    Team: ${hacker.teamSlug} (role not found)`);
      }
      if (hacker.trackName) {
        const mappedName = TRACK_ROLE_MAP[hacker.trackName.toLowerCase()];
        if (mappedName) {
          console.log(
            `    Track: ${hacker.trackName} -> ${mappedName} (role not found)`,
          );
        } else {
          console.log(`    Track: ${hacker.trackName} (no mapping found)`);
        }
      } else if (!hacker.teamSlug) {
        console.log(`    No team assigned`);
      }
      skippedCount++;
      continue;
    }

    console.log(
      `Assigning roles to ${hacker.fullName} (${hacker.github || 'no-github'})`,
    );
    console.log(`  Discord ID: ${hacker.discordId}`);
    console.log(`  Team: ${hacker.teamSlug || 'none'}`);
    console.log(`  Track: ${hacker.trackRoleName || 'none'}`);
    console.log(`  Roles to assign: ${rolesToAssign.length}`);

    if (DRY_RUN) {
      for (const role of rolesToAssign) {
        console.log(`  [DRY RUN] Would assign role: ${role.name} (${role.id})`);
      }
      assignedCount++;
    } else {
      let success = true;
      for (const role of rolesToAssign) {
        if (role.id === 'dry-run-role-id') {
          console.log(`  ⚠️  Skipping role ${role.name} - not found`);
          continue;
        }

        try {
          const userId = hacker.discordId;
          if (!userId) {
            console.error(`  ❌ No Discord ID for ${hacker.fullName}`);
            continue;
          }
          console.log(
            `  Attempting to assign role ${role.name} (${role.id}) to user ${userId}`,
          );
          await client.addRole({
            userId,
            roleId: role.id,
          });
          console.log(`  ✅ Assigned role: ${role.name}`);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);

          console.error(
            `  ❌ Error assigning role ${role.name}:`,
            errorMessage,
          );
          console.error(`    User ID: ${hacker.discordId}`);
          console.error(`    Role ID: ${role.id}`);

          const isRateLimit =
            errorMessage.includes('rate limit') ||
            errorMessage.includes('429') ||
            errorMessage.includes('Too Many Requests');

          if (isRateLimit) {
            console.log(`  ⏳ Rate limited, waiting 1 second...`);
            await new Promise((resolve) => setTimeout(resolve, 1000));
            // Retry once after waiting
            try {
              const retryUserId = hacker.discordId;
              if (!retryUserId) {
                console.error(
                  `  ❌ No Discord ID for retry ${hacker.fullName}`,
                );
                continue;
              }
              await client.addRole({
                userId: retryUserId,
                roleId: role.id,
              });
              console.log(`  ✅ Assigned role: ${role.name} (after retry)`);
            } catch (retryError) {
              const retryErrorMessage =
                retryError instanceof Error
                  ? retryError.message
                  : String(retryError);
              console.error(
                `  ❌ Failed to assign role ${role.name} after retry:`,
                retryErrorMessage,
              );
              success = false;
            }
          } else {
            console.error(
              `  ❌ Failed to assign role ${role.name}:`,
              errorMessage,
            );
            success = false;
          }
        }
      }

      if (success) {
        assignedCount++;
      } else {
        failedCount++;
      }
    }

    // Wait 2 seconds between each hacker assignment
    if (!DRY_RUN) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    console.log('');
  }

  // Summary
  console.log('='.repeat(80));
  console.log('Summary');
  console.log('='.repeat(80));
  console.log(`Total hackers processed: ${hackersWithRoles.length}`);
  console.log(`Roles assigned: ${assignedCount}`);
  console.log(`Skipped: ${skippedCount}`);
  console.log(`Failed: ${failedCount}`);
  console.log(`Team roles created/verified: ${teamRoleMap.size}`);
  console.log(`Track roles created/verified: ${trackRoleMap.size}`);
  console.log('');
}

main().catch((error) => {
  console.error('Error:', error instanceof Error ? error.message : error);
  process.exit(1);
});
