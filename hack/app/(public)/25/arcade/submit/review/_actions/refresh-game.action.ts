'use server';

import { minify } from '@swc/core';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import sharp from 'sharp';
import { db } from '@/src/lib/db';
import { arcadeGameVersions } from '@/src/lib/db/schema';
import { uploadFile } from '@/src/lib/storage';
import { getArcadeCoverStorageKey } from '@/src/lib/storage/keys';
import { fetchViaProxy, getFileBase64 } from '@/src/lib/utils/github';
import { checkRestrictions } from '@/src/operators/arcade-game-submission';
import { getArcadeGameFlatById } from '@/src/queries/arcade-games';

interface RefreshResult {
  success: boolean;
  message: string;
  game?: {
    title: string;
    description: string | null;
    commitSha: string | null;
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

function convertToRawUrl(repoUrl: string): string | null {
  const info = extractGithubInfo(repoUrl);
  if (!info) return null;

  return `https://raw.githubusercontent.com/${info.username}/${info.repoName}/${info.branch}`;
}

export async function refreshGameAction(
  gameId: string,
): Promise<RefreshResult> {
  try {
    // Fetch the game (flat: game + latest version)
    const game = await getArcadeGameFlatById(gameId);

    if (!game) {
      return {
        success: false,
        message: 'Game not found',
      };
    }

    // Extract GitHub info
    const githubInfo = extractGithubInfo(game.repoUrl);
    if (!githubInfo) {
      return {
        success: false,
        message: 'Invalid GitHub repository URL',
      };
    }

    // Fetch the latest commit SHA and date from GitHub API
    let commitSha: string | null = null;
    let commitDate: Date | null = null;
    try {
      const githubApiUrl = `https://api.github.com/repos/${githubInfo.username}/${githubInfo.repoName}/commits/${githubInfo.branch}`;
      const commitResponse = await fetchViaProxy(githubApiUrl, {
        headers: {
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (commitResponse.ok) {
        const commitData = await commitResponse.json();
        commitSha = commitData.sha;
        if (commitData.commit?.author?.date) {
          commitDate = new Date(commitData.commit.author.date);
        }
      } else {
        console.error(
          'Failed to fetch commit data:',
          commitResponse.statusText,
        );
      }
    } catch (error) {
      console.error('Error fetching commit data:', error);
    }

    // Fetch metadata.json
    const rawBaseUrl = convertToRawUrl(game.repoUrl);
    if (!rawBaseUrl) {
      return {
        success: false,
        message: 'Invalid GitHub repository URL',
      };
    }

    const metadataUrl = `${rawBaseUrl}/metadata.json`;
    const metadataResponse = await fetchViaProxy(metadataUrl);

    if (!metadataResponse.ok) {
      return {
        success: false,
        message: `Failed to fetch metadata.json (status: ${metadataResponse.status})`,
      };
    }

    interface MetadataResponse {
      game_name: string;
      author?: string;
      description?: string;
    }

    const metadata: MetadataResponse = await metadataResponse.json();

    // Fetch game.js
    const gameJsUrl = `${rawBaseUrl}/game.js`;
    const gameJsResponse = await fetchViaProxy(gameJsUrl);

    if (!gameJsResponse.ok) {
      return {
        success: false,
        message: 'game.js not found in repository',
      };
    }

    const gameCode = await gameJsResponse.text();

    if (!gameCode || gameCode.trim().length === 0) {
      return {
        success: false,
        message: 'game.js is empty',
      };
    }

    // Check restrictions
    const restrictionResults = await checkRestrictions(gameCode);

    if (!restrictionResults.passed) {
      return {
        success: false,
        message: 'Game failed validation checks',
      };
    }

    // Minify code
    let codeMinified: string;
    try {
      codeMinified = await minifyCode(gameCode);
    } catch (minifyError) {
      console.error(
        '[refreshGameAction] Minification failed, using original code:',
        minifyError,
      );
      codeMinified = gameCode;
    }

    // Fetch cover.png if it exists
    let coverUrl: string | null = null;
    try {
      if (commitSha) {
        const coverBase64 = await getFileBase64(
          githubInfo.username,
          githubInfo.repoName,
          'cover.png',
          commitSha,
        );

        if (coverBase64) {
          // Compress and upload to Vercel Blob
          const imageBuffer = Buffer.from(coverBase64, 'base64');
          const compressedBuffer = await sharp(imageBuffer)
            .png({
              compressionLevel: 9,
              palette: true,
              quality: 80,
            })
            .toBuffer();

          const blob = await uploadFile({
            key: getArcadeCoverStorageKey(game.slug || game.id),
            body: compressedBuffer,
            access: 'public',
            contentType: 'image/png',
          });

          coverUrl = blob.url;
        }
      }
    } catch (coverError) {
      console.error(
        '[refreshGameAction] Failed to fetch/upload cover.png:',
        coverError,
      );
      // Continue without cover if fetch fails
    }

    // Update the version in database
    const updateData: Record<string, unknown> = {
      title: metadata.game_name,
      description: metadata.description || null,
      code: gameCode,
      codeMinified,
      commitSha,
      commitDate,
    };

    // Only update cover if we successfully fetched a new one
    if (coverUrl) {
      updateData.coverUrl = coverUrl;
    }

    const [updatedGame] = await db
      .update(arcadeGameVersions)
      .set(updateData)
      .where(eq(arcadeGameVersions.id, game.versionId))
      .returning();

    // Revalidate the review page
    revalidatePath(`/25/arcade/submit/review/${gameId}`);

    return {
      success: true,
      message: 'Game refreshed successfully',
      game: {
        title: updatedGame.title,
        description: updatedGame.description,
        commitSha: updatedGame.commitSha,
      },
    };
  } catch (error) {
    console.error('Refresh game error:', error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : 'Failed to refresh game',
    };
  }
}
