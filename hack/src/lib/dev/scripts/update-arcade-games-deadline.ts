import { minify } from '@swc/core';
import { eq } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import { arcadeGames } from '@/src/lib/db/schema';
import { getFileBase64, getFileContent } from '@/src/lib/utils/github';

const DEADLINE = new Date('2025-11-10T23:59:59-03:00'); // Nov 10, 23:59 CLT (UTC-3)

interface MetadataResponse {
  game_name: string;
  author?: string;
  description?: string;
}

interface GitHubCommit {
  sha: string;
  commit: {
    author: {
      date: string;
    };
    message: string;
  };
}

async function minifyCode(code: string): Promise<string> {
  const result = await minify(code, {
    compress: true,
    mangle: true,
  });

  if (!result.code) {
    throw new Error('Minification returned empty code');
  }

  return result.code;
}

async function getCommitsUntilDeadline(
  owner: string,
  repo: string,
  branch = 'main',
): Promise<GitHubCommit[]> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error('GITHUB_TOKEN environment variable is not set');
  }

  const allCommits: GitHubCommit[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const url = `https://api.github.com/repos/${owner}/${repo}/commits?sha=${branch}&until=${DEADLINE.toISOString()}&per_page=${perPage}&page=${page}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (response.status === 409) {
      // Empty repository
      return [];
    }

    if (!response.ok) {
      throw new Error(
        `Failed to fetch commits for ${owner}/${repo}: ${response.status} ${response.statusText}`,
      );
    }

    const commits: GitHubCommit[] = await response.json();

    if (commits.length === 0) {
      break;
    }

    allCommits.push(...commits);

    if (commits.length < perPage) {
      break;
    }

    page++;
  }

  return allCommits;
}

function extractGithubInfo(repoUrl: string): {
  username: string;
  repoName: string;
  branch: string;
} | null {
  try {
    const url = new URL(repoUrl);
    if (!url.hostname.includes('github.com')) {
      return null;
    }

    const pathParts = url.pathname.split('/').filter(Boolean);
    if (pathParts.length < 2) {
      return null;
    }

    const [username, repo, ...rest] = pathParts;

    let branch = 'main';
    if (rest[0] === 'tree' && rest[1]) {
      branch = rest[1];
    }

    return {
      username,
      repoName: repo,
      branch,
    };
  } catch {
    return null;
  }
}

async function updateArcadeGame(
  gameId: string,
  gameSlug: string,
  repoUrl: string,
) {
  console.log(`\nProcessing: ${gameSlug}`);

  const githubInfo = extractGithubInfo(repoUrl);
  if (!githubInfo) {
    console.error(`  ❌ Invalid GitHub URL: ${repoUrl}`);
    return { success: false, error: 'Invalid GitHub URL' };
  }

  // Get commits until deadline
  const commits = await getCommitsUntilDeadline(
    githubInfo.username,
    githubInfo.repoName,
    githubInfo.branch,
  );

  if (commits.length === 0) {
    console.error(`  ❌ No commits found before deadline`);
    return { success: false, error: 'No commits before deadline' };
  }

  const latestCommit = commits[0];
  const commitSha = latestCommit.sha;
  const commitDate = new Date(latestCommit.commit.author.date);

  console.log(
    `  📝 Latest commit: ${commitSha.substring(0, 7)} (${commitDate.toISOString()})`,
  );

  // Fetch metadata.json
  const metadataContent = await getFileContent(
    githubInfo.username,
    githubInfo.repoName,
    'metadata.json',
    commitSha,
  );

  if (!metadataContent) {
    console.error(
      `  ❌ metadata.json not found at commit ${commitSha.substring(0, 7)}`,
    );
    return { success: false, error: 'metadata.json not found' };
  }

  let metadata: MetadataResponse;
  try {
    metadata = JSON.parse(metadataContent);
  } catch {
    console.error(`  ❌ Failed to parse metadata.json`);
    return { success: false, error: 'Invalid metadata.json' };
  }

  // Fetch game.js
  const gameCode = await getFileContent(
    githubInfo.username,
    githubInfo.repoName,
    'game.js',
    commitSha,
  );

  if (!gameCode) {
    console.error(
      `  ❌ game.js not found at commit ${commitSha.substring(0, 7)}`,
    );
    return { success: false, error: 'game.js not found' };
  }

  // Minify code
  let codeMinified: string;
  try {
    codeMinified = await minifyCode(gameCode);
  } catch (_minifyError) {
    console.warn(`  ⚠️ Minification failed, using original code`);
    codeMinified = gameCode;
  }

  // Fetch cover.png
  let coverBase64: string | null = null;
  try {
    coverBase64 = await getFileBase64(
      githubInfo.username,
      githubInfo.repoName,
      'cover.png',
      commitSha,
    );
  } catch (_coverError) {
    console.warn(`  ⚠️ Failed to fetch cover.png`);
  }

  // Update database
  const updateData: Record<string, unknown> = {
    title: metadata.game_name,
    description: metadata.description || null,
    code: gameCode,
    codeMinified,
    commitSha,
    commitDate,
  };

  if (coverBase64) {
    updateData.coverBase64 = coverBase64;
  }

  await db
    .update(arcadeGames)
    .set(updateData)
    .where(eq(arcadeGames.id, gameId));

  console.log(`  ✅ Updated: "${metadata.game_name}"`);
  return { success: true, title: metadata.game_name };
}

async function main() {
  console.log('🎮 Arcade Games Deadline Update Script');
  console.log(`📅 Deadline: ${DEADLINE.toISOString()}`);
  console.log('');

  // Get all arcade games
  const games = await db.select().from(arcadeGames);

  console.log(`Found ${games.length} games to process`);

  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (const game of games) {
    try {
      const result = await updateArcadeGame(game.id, game.slug, game.repoUrl);
      if (result.success) {
        results.success++;
      } else {
        results.failed++;
        results.errors.push(`${game.slug}: ${result.error}`);
      }
    } catch (error) {
      results.failed++;
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      results.errors.push(`${game.slug}: ${errorMessage}`);
      console.error(`  ❌ Error: ${errorMessage}`);
    }

    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log('\n📊 Summary');
  console.log(`  ✅ Success: ${results.success}`);
  console.log(`  ❌ Failed: ${results.failed}`);

  if (results.errors.length > 0) {
    console.log('\n❌ Errors:');
    results.errors.forEach((err) => console.log(`  - ${err}`));
  }
}

main()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
