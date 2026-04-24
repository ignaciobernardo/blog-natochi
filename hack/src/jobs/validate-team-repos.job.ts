import crypto from 'node:crypto';
import { eq, gt, sql } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import { hackerProfiles, teams } from '@/src/lib/db/schema';

const DEFAULT_LOGO_SHA256 =
  'f458397e9cdfa4773deef8303177fa03e355a0e4842a7805c8139e782e03a8f3';

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

async function validateProjectLogo(
  owner: string,
  repo: string,
  branch = 'main',
): Promise<ValidationResult> {
  const errors: string[] = [];

  try {
    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
      return { valid: false, errors: ['GitHub token not configured'] };
    }

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/project-logo.png?ref=${branch}`,
      {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      },
    );

    if (!response.ok) {
      if (response.status === 404) {
        return { valid: false, errors: ['missing project-logo.png'] };
      }
      return { valid: false, errors: ['failed to fetch project-logo.png'] };
    }

    const data = await response.json();

    if (data.type !== 'file') {
      return { valid: false, errors: ['project-logo.png is not a file'] };
    }

    const sizeBytes = data.size;
    const maxSizeBytes = 500 * 1024;

    if (sizeBytes > maxSizeBytes) {
      errors.push(
        `logo too large (${Math.round(sizeBytes / 1024)}KB, max 500KB)`,
      );
    }

    // Remove newlines to match sync-projects job behavior
    const cleanContent = data.content.replace(/\n/g, '');
    const imageBuffer = Buffer.from(cleanContent, 'base64');

    const imageSha256 = crypto
      .createHash('sha256')
      .update(imageBuffer)
      .digest('hex');
    if (imageSha256 === DEFAULT_LOGO_SHA256) {
      errors.push('default logo must be changed');
    }

    const sharp = (await import('sharp')).default;

    try {
      const metadata = await sharp(imageBuffer).metadata();

      if (metadata.format !== 'png') {
        errors.push(`must be PNG (got ${metadata.format})`);
      }

      if (metadata.width !== 1000 || metadata.height !== 1000) {
        errors.push(
          `logo must be 1000x1000 (got ${metadata.width}x${metadata.height})`,
        );
      }
    } catch {
      errors.push('invalid image file');
    }
  } catch (error) {
    console.error('Error validating project logo:', error);
    return { valid: false, errors: ['error checking logo'] };
  }

  return { valid: errors.length === 0, errors };
}

async function validateProjectConfig(
  owner: string,
  repo: string,
  branch = 'main',
): Promise<ValidationResult> {
  const errors: string[] = [];

  try {
    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
      return { valid: false, errors: ['GitHub token not configured'] };
    }

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/platanus-hack-project.json?ref=${branch}`,
      {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      },
    );

    if (!response.ok) {
      if (response.status === 404) {
        return {
          valid: false,
          errors: ['missing platanus-hack-project.json'],
        };
      }
      return {
        valid: false,
        errors: ['failed to fetch platanus-hack-project.json'],
      };
    }

    const data = await response.json();

    if (data.type !== 'file') {
      return {
        valid: false,
        errors: ['platanus-hack-project.json is not a file'],
      };
    }

    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    let config: any;

    try {
      config = JSON.parse(content);
    } catch {
      return { valid: false, errors: ['invalid JSON in config file'] };
    }

    const projectName = config['project-name'];
    if (!projectName || typeof projectName !== 'string') {
      errors.push('missing project-name');
    } else if (
      projectName.trim() === '<FILL THIS>' ||
      projectName.trim() === ''
    ) {
      errors.push('project-name not filled');
    }

    const projectDesc = config['project-description-spanish'];
    if (!projectDesc || typeof projectDesc !== 'string') {
      errors.push('missing project-description-spanish');
    } else if (
      projectDesc.trim() === '<FILL THIS>' ||
      projectDesc.trim() === ''
    ) {
      errors.push('project-description-spanish not filled');
    }

    const deployUrl = config['deploy-url'];
    if (!deployUrl || typeof deployUrl !== 'string') {
      errors.push('missing deploy-url');
    } else if (deployUrl.trim() === '<FILL THIS>' || deployUrl.trim() === '') {
      errors.push('deploy-url not filled');
    } else {
      try {
        new URL(deployUrl.trim());
      } catch {
        errors.push('invalid deploy-url');
      }
    }
  } catch (error) {
    console.error('Error validating project config:', error);
    return { valid: false, errors: ['error checking config'] };
  }

  return { valid: errors.length === 0, errors };
}

async function validateProjectDescription(
  owner: string,
  repo: string,
  branch = 'main',
): Promise<ValidationResult> {
  try {
    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
      return { valid: false, errors: ['GitHub token not configured'] };
    }

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/project-description.md?ref=${branch}`,
      {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      },
    );

    if (!response.ok) {
      if (response.status === 404) {
        return { valid: false, errors: ['missing project-description.md'] };
      }
      return {
        valid: false,
        errors: ['failed to fetch project-description.md'],
      };
    }

    const data = await response.json();

    if (data.type !== 'file') {
      return {
        valid: false,
        errors: ['project-description.md is not a file'],
      };
    }

    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    const trimmedContent = content.trim();

    if (trimmedContent === '' || trimmedContent === '<FILL THIS>') {
      return {
        valid: false,
        errors: ['project-description.md not filled'],
      };
    }

    return { valid: true, errors: [] };
  } catch (error) {
    console.error('Error validating project description:', error);
    return { valid: false, errors: ['error checking description'] };
  }
}

function sortTeamsBySlug(
  teams: Array<{ slug: string; memberCount: number }>,
): Array<{ slug: string; memberCount: number }> {
  return teams.sort((a, b) => {
    const aMatch = a.slug.match(/^(solo|team)-(\d+)$/);
    const bMatch = b.slug.match(/^(solo|team)-(\d+)$/);

    if (!aMatch || !bMatch) {
      return a.slug.localeCompare(b.slug);
    }

    const [, aType, aNum] = aMatch;
    const [, bType, bNum] = bMatch;

    if (aType !== bType) {
      return aType === 'solo' ? -1 : 1;
    }

    return Number.parseInt(aNum, 10) - Number.parseInt(bNum, 10);
  });
}

export async function validateTeamRepos(): Promise<void> {
  console.log('\n🔍 Starting team repository validation...\n');

  const teamsWithMembers = await db
    .select({
      slug: teams.slug,
      memberCount: sql<number>`count(${hackerProfiles.id})`,
    })
    .from(teams)
    .leftJoin(hackerProfiles, eq(hackerProfiles.teamId, teams.id))
    .groupBy(teams.id, teams.slug)
    .having(gt(sql`count(${hackerProfiles.id})`, 0));

  const sortedTeams = sortTeamsBySlug(teamsWithMembers);

  console.log(`Found ${sortedTeams.length} teams with members\n`);

  const owner = 'platanus-hack';

  const results = await Promise.all(
    sortedTeams.map(async (team) => {
      if (!team.slug) {
        return null;
      }

      const repoName = `platanus-hack-25-${team.slug}`;

      const [logoResult, configResult, descriptionResult] = await Promise.all([
        validateProjectLogo(owner, repoName),
        validateProjectConfig(owner, repoName),
        validateProjectDescription(owner, repoName),
      ]);

      const allErrors: string[] = [
        ...logoResult.errors,
        ...configResult.errors,
        ...descriptionResult.errors,
      ];

      const isValid =
        logoResult.valid && configResult.valid && descriptionResult.valid;

      return {
        slug: team.slug,
        valid: isValid,
        errors: allErrors,
      };
    }),
  );

  const validResults = results.filter(
    (r): r is { slug: string; valid: boolean; errors: string[] } => r !== null,
  );

  for (const result of validResults) {
    if (result.valid) {
      console.log(`${result.slug}: ✅`);
    } else {
      console.log(`${result.slug}: ❌ ${result.errors.join(', ')}`);
    }
  }

  const validCount = validResults.filter((r) => r.valid).length;
  const invalidCount = validResults.filter((r) => !r.valid).length;

  console.log('\n📊 Summary:');
  console.log(`✅ Valid: ${validCount}`);
  console.log(`❌ Invalid: ${invalidCount}`);
  console.log(`📦 Total teams: ${sortedTeams.length}\n`);
}
