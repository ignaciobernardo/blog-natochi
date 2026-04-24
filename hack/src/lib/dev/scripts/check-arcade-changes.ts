import { db } from '@/src/lib/db';
import { arcadeGames } from '@/src/lib/db/schema';
import { getFileContent } from '@/src/lib/utils/github';

const DEADLINE = new Date('2025-11-10T23:59:59-03:00'); // Nov 10, 23:59 CLT (UTC-3)

interface GitHubCommit {
  sha: string;
  commit: {
    author: {
      date: string;
    };
    message: string;
  };
}

interface MetadataResponse {
  game_name: string;
  author?: string;
  description?: string;
}

interface GameChange {
  slug: string;
  changes: string[];
  oldCommit?: string;
  newCommit?: string;
  oldTitle?: string;
  newTitle?: string;
}

async function getLatestCommitBeforeDeadline(
  owner: string,
  repo: string,
  branch = 'main',
): Promise<GitHubCommit | null> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error('GITHUB_TOKEN environment variable is not set');
  }

  const url = `https://api.github.com/repos/${owner}/${repo}/commits?sha=${branch}&until=${DEADLINE.toISOString()}&per_page=1`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  if (response.status === 409 || response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(
      `Failed to fetch commits: ${response.status} ${response.statusText}`,
    );
  }

  const commits: GitHubCommit[] = await response.json();
  return commits[0] || null;
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

async function checkGameChanges(
  game: typeof arcadeGames.$inferSelect,
): Promise<GameChange | null> {
  const githubInfo = extractGithubInfo(game.repoUrl);
  if (!githubInfo) {
    return null;
  }

  const latestCommit = await getLatestCommitBeforeDeadline(
    githubInfo.username,
    githubInfo.repoName,
    githubInfo.branch,
  );

  if (!latestCommit) {
    return null;
  }

  const changes: string[] = [];

  // Check if commit SHA changed
  if (game.commitSha !== latestCommit.sha) {
    changes.push('commit');
  }

  // Fetch metadata to check title
  const metadataContent = await getFileContent(
    githubInfo.username,
    githubInfo.repoName,
    'metadata.json',
    latestCommit.sha,
  );

  let newTitle: string | undefined;
  if (metadataContent) {
    try {
      const metadata: MetadataResponse = JSON.parse(metadataContent);
      newTitle = metadata.game_name;
      if (game.title !== metadata.game_name) {
        changes.push('title');
      }
    } catch {
      // Ignore parse errors
    }
  }

  // Fetch code to check if it changed
  const newCode = await getFileContent(
    githubInfo.username,
    githubInfo.repoName,
    'game.js',
    latestCommit.sha,
  );

  if (newCode && game.code !== newCode) {
    changes.push('code');
  }

  if (changes.length === 0) {
    return null;
  }

  return {
    slug: game.slug,
    changes,
    oldCommit: game.commitSha?.substring(0, 7),
    newCommit: latestCommit.sha.substring(0, 7),
    oldTitle: game.title,
    newTitle,
  };
}

async function main() {
  console.log('🔍 Checking Arcade Games for Changes');
  console.log(`📅 Deadline: ${DEADLINE.toISOString()}`);
  console.log('');

  // Get all arcade games
  const games = await db.select().from(arcadeGames);

  console.log(`Found ${games.length} games to check`);
  console.log('Fetching data in parallel...\n');

  // Process all games in parallel
  const results = await Promise.all(
    games.map(async (game) => {
      try {
        return await checkGameChanges(game);
      } catch (error) {
        console.error(
          `Error checking ${game.slug}:`,
          error instanceof Error ? error.message : error,
        );
        return null;
      }
    }),
  );

  // Filter out games with no changes
  const changedGames = results.filter((r): r is GameChange => r !== null);

  if (changedGames.length === 0) {
    console.log('✅ No changes detected in any games');
    return;
  }

  console.log(`📊 Found ${changedGames.length} games with changes:\n`);

  for (const game of changedGames) {
    console.log(`🎮 ${game.slug}`);
    console.log(`   Changes: ${game.changes.join(', ')}`);
    if (game.changes.includes('commit')) {
      console.log(`   Commit: ${game.oldCommit} → ${game.newCommit}`);
    }
    if (game.changes.includes('title')) {
      console.log(`   Title: "${game.oldTitle}" → "${game.newTitle}"`);
    }
    console.log('');
  }

  console.log('📊 Summary by change type:');
  const commitChanges = changedGames.filter((g) =>
    g.changes.includes('commit'),
  ).length;
  const titleChanges = changedGames.filter((g) =>
    g.changes.includes('title'),
  ).length;
  const codeChanges = changedGames.filter((g) =>
    g.changes.includes('code'),
  ).length;

  console.log(`   Commit: ${commitChanges}`);
  console.log(`   Title: ${titleChanges}`);
  console.log(`   Code: ${codeChanges}`);
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
