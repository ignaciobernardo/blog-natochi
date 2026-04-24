import { db } from '@/src/lib/db';
import { teams } from '@/src/lib/db/schema';
import { googleSheetsService } from '@/src/services/google-sheets';

interface ProjectConfig {
  'project-name': string;
  'project-description-spanish': string;
  'deploy-url': string;
}

async function fetchProjectConfig(
  teamSlug: string,
): Promise<ProjectConfig | null> {
  try {
    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
      console.error('❌ GITHUB_TOKEN not configured');
      return null;
    }

    const owner = 'platanus-hack';
    const repo = `platanus-hack-25-${teamSlug}`;

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/platanus-hack-project.json`,
      {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      },
    );

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`⚠️  Repository not found: ${owner}/${repo}`);
        return null;
      }
      const errorText = await response.text();
      console.error(
        `❌ Failed to fetch project config for ${teamSlug}: ${response.status} - ${errorText}`,
      );
      return null;
    }

    const data = await response.json();

    if (data.type !== 'file') {
      console.error(
        `❌ platanus-hack-project.json is not a file for ${teamSlug}`,
      );
      return null;
    }

    const content = Buffer.from(data.content, 'base64').toString('utf-8');

    let config: ProjectConfig;
    try {
      config = JSON.parse(content);
    } catch (parseError) {
      console.error(
        `❌ Failed to parse JSON for ${teamSlug}:`,
        parseError instanceof Error ? parseError.message : 'Unknown error',
      );
      return null;
    }

    const projectName = config['project-name'];
    if (
      !projectName ||
      typeof projectName !== 'string' ||
      projectName.trim() === '<FILL THIS>' ||
      projectName.trim() === ''
    ) {
      console.warn(`⚠️  Project name not set for ${teamSlug}`);
      return null;
    }

    return config;
  } catch (error) {
    console.error(`❌ Error fetching project config for ${teamSlug}:`, error);
    return null;
  }
}

async function main() {
  console.log(
    '\n🔄 Starting project name sync from GitHub to spreadsheet...\n',
  );

  try {
    const allTeams = await db.select({ slug: teams.slug }).from(teams);
    console.log(`📋 Found ${allTeams.length} teams in database\n`);

    const updates: Array<{ teamSlug: string; projectName: string }> = [];
    const failed: Array<{ teamSlug: string; reason: string }> = [];

    for (const team of allTeams) {
      console.log(`\n🔍 Processing team: ${team.slug}`);

      const config = await fetchProjectConfig(team.slug);

      if (!config) {
        failed.push({
          teamSlug: team.slug,
          reason: 'Could not fetch or parse project config',
        });
        continue;
      }

      const projectName = config['project-name'];
      console.log(`📝 Found project name: "${projectName}"`);

      try {
        await googleSheetsService.updateProjectName(team.slug, projectName);
        updates.push({ teamSlug: team.slug, projectName });
      } catch (error) {
        failed.push({
          teamSlug: team.slug,
          reason:
            error instanceof Error ? error.message : 'Failed to update sheet',
        });
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log('\n\n📊 Summary:');
    console.log(`✅ Successfully updated: ${updates.length} teams`);
    console.log(`❌ Failed: ${failed.length} teams`);

    if (updates.length > 0) {
      console.log('\n✅ Successfully updated:');
      for (const { teamSlug, projectName } of updates) {
        console.log(`   - ${teamSlug}: "${projectName}"`);
      }
    }

    if (failed.length > 0) {
      console.log('\n❌ Failed updates:');
      for (const { teamSlug, reason } of failed) {
        console.log(`   - ${teamSlug}: ${reason}`);
      }
    }

    console.log('\n✅ Project name sync completed!\n');
  } catch (error) {
    console.error('❌ Error in main process:', error);
    process.exit(1);
  }
}

main();
