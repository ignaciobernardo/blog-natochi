import { minify } from '@swc/core';
import sharp from 'sharp';
import { db } from '@/src/lib/db';
import { arcadeGames, arcadeGameVersions } from '@/src/lib/db/schema';
import { uploadFile } from '@/src/lib/storage';
import { getArcadeCoverStorageKey } from '@/src/lib/storage/keys';
import { fetchViaProxy } from '@/src/lib/utils/github';
import { generateUniqueSlug } from '@/src/lib/utils/slugify';
import {
  getArcadeChallengeByEventId,
  getArcadeGameByGithubUser,
} from '@/src/queries/arcade-games';

const MAX_SIZE_KB = 50;
const MAX_SIZE_BYTES = MAX_SIZE_KB * 1024;
const REQUIRED_COVER_WIDTH = 800;
const REQUIRED_COVER_HEIGHT = 600;

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

interface PngDimensions {
  width: number;
  height: number;
}

function validatePngAndGetDimensions(base64Data: string): PngDimensions | null {
  try {
    // Decode base64 to buffer
    const buffer = Buffer.from(base64Data, 'base64');

    // PNG signature: 89 50 4E 47 0D 0A 1A 0A
    const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    for (let i = 0; i < pngSignature.length; i++) {
      if (buffer[i] !== pngSignature[i]) {
        return null; // Not a valid PNG
      }
    }

    // Read IHDR chunk (contains width and height)
    // IHDR starts at byte 8, followed by length (4 bytes), "IHDR" (4 bytes)
    // Width is at bytes 16-19, Height is at bytes 20-23
    if (buffer.length < 24) {
      return null; // File too small
    }

    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);

    return { width, height };
  } catch (_error) {
    return null;
  }
}

export interface RestrictionResult {
  name: string;
  passed: boolean;
  message: string;
  details?: string;
}

export interface CheckResults {
  passed: boolean;
  results: RestrictionResult[];
  sizeKB: number;
  minifiedSize: number;
  originalSizeKB: number;
}

interface MetadataResponse {
  game_name: string;
  author?: string;
  description?: string;
}

interface CreateDraftResult {
  success: boolean;
  message: string;
  gameId?: string;
  restrictions?: CheckResults;
}

export async function checkRestrictions(
  gameCode: string,
): Promise<CheckResults> {
  const results: RestrictionResult[] = [];
  let allPassed = true;

  // Check 1: No import statements
  const hasImport =
    /\b(import|require)\s*\(/.test(gameCode) || /^import\s+/m.test(gameCode);
  results.push({
    name: 'No Imports',
    passed: !hasImport,
    message: hasImport
      ? 'Found import/require statements'
      : 'No imports detected',
  });
  if (hasImport) allPassed = false;

  // Check 2: No fetch or XMLHttpRequest
  const hasFetch = /\b(fetch|XMLHttpRequest|axios|ajax)\s*\(/.test(gameCode);
  results.push({
    name: 'No Network Calls',
    passed: !hasFetch,
    message: hasFetch
      ? 'Found network call patterns (fetch/XMLHttpRequest)'
      : 'No network calls detected',
  });
  if (hasFetch) allPassed = false;

  // Check 3: No external URLs (except data: URIs)
  const externalUrlPattern = /(https?:\/\/|\/\/[a-zA-Z0-9])/g;
  const lines = gameCode.split('\n');
  const urlMatches: string[] = [];

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const matches = line.match(externalUrlPattern);
    if (matches) {
      matches.forEach(() => {
        const snippet = line.trim().substring(0, 80);
        urlMatches.push(
          `Line ${lineNum}: "${snippet}${line.length > 80 ? '...' : ''}"`,
        );
      });
    }
  });

  const hasExternalUrl = urlMatches.length > 0;
  results.push({
    name: 'No External URLs',
    passed: !hasExternalUrl,
    message: hasExternalUrl
      ? `Found ${urlMatches.length} external URL(s)`
      : 'No external URLs detected',
    details: hasExternalUrl ? urlMatches.join('\n') : undefined,
  });
  if (hasExternalUrl) allPassed = false;

  // Check 4: Warn on suspicious patterns (not a failure, just a warning)
  const hasSuspicious = /\b(eval|Function\s*\(|new\s+Function)\s*\(/.test(
    gameCode,
  );
  results.push({
    name: 'Code Safety',
    passed: !hasSuspicious,
    message: hasSuspicious
      ? 'Warning: Found eval() or Function constructor'
      : 'No suspicious patterns detected',
    details: hasSuspicious
      ? 'These patterns are allowed but discouraged'
      : undefined,
  });
  // Don't fail on suspicious patterns, just warn

  // Check 5: File size after minification
  let minifiedSize: number;
  const originalSizeKB = Buffer.byteLength(gameCode, 'utf-8') / 1024;

  try {
    const minifiedCode = await minifyCode(gameCode);
    minifiedSize = Buffer.byteLength(minifiedCode, 'utf-8');
  } catch (error) {
    console.error(
      '[checkRestrictions] Minification failed, using original size:',
      error,
    );
    minifiedSize = Buffer.byteLength(gameCode, 'utf-8');
  }

  const sizeKB = minifiedSize / 1024;
  results.push({
    name: 'Size Check',
    passed: minifiedSize <= MAX_SIZE_BYTES,
    message:
      minifiedSize <= MAX_SIZE_BYTES
        ? `${sizeKB.toFixed(2)} KB (under ${MAX_SIZE_KB} KB limit)`
        : `${sizeKB.toFixed(2)} KB (exceeds ${MAX_SIZE_KB} KB limit)`,
    details: `Original: ${originalSizeKB.toFixed(2)} KB, Minified: ${sizeKB.toFixed(2)} KB`,
  });

  if (minifiedSize > MAX_SIZE_BYTES) allPassed = false;

  return {
    passed: allPassed,
    results,
    sizeKB: minifiedSize / 1024,
    minifiedSize,
    originalSizeKB: Buffer.byteLength(gameCode, 'utf-8') / 1024,
  };
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

export async function createArcadeGameDraft(
  repoUrl: string,
  eventId: string,
): Promise<CreateDraftResult> {
  try {
    const challenge = await getArcadeChallengeByEventId(eventId);
    if (!challenge) {
      return {
        success: false,
        message: 'no arcade challenge found for this event',
      };
    }

    // Extract GitHub info
    const githubInfo = extractGithubInfo(repoUrl);
    if (!githubInfo) {
      return {
        success: false,
        message: 'invalid github repository url',
      };
    }

    // Check if draft already exists for this repo
    const existing = await getArcadeGameByGithubUser(
      githubInfo.username,
      challenge.id,
    );

    if (existing) {
      return {
        success: false,
        message: 'game submission already exists for this repository',
        gameId: existing.id,
      };
    }

    // Fetch the commit SHA and date from GitHub API
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
      }
    } catch (error) {
      console.error('Failed to fetch commit data:', error);
      // Continue without commit data if GitHub API fails
    }

    // Fetch metadata.json
    const rawBaseUrl = convertToRawUrl(repoUrl);
    if (!rawBaseUrl) {
      return {
        success: false,
        message: 'invalid github repository url',
      };
    }

    const metadataUrl = `${rawBaseUrl}/metadata.json`;
    const metadataResponse = await fetchViaProxy(metadataUrl);

    if (!metadataResponse.ok) {
      if (metadataResponse.status === 404) {
        return {
          success: false,
          message: 'repository not found or metadata.json is missing',
        };
      }
      return {
        success: false,
        message: `failed to fetch metadata.json (status: ${metadataResponse.status})`,
      };
    }

    const metadata: MetadataResponse = await metadataResponse.json();

    // Validate game_name
    if (
      !metadata.game_name ||
      metadata.game_name === '<FILL THIS>' ||
      metadata.game_name.trim() === ''
    ) {
      return {
        success: false,
        message:
          'game_name must be filled in metadata.json (not "<FILL THIS>")',
      };
    }

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
        message: 'game failed validation checks',
        restrictions: restrictionResults,
      };
    }

    // Minify code
    let codeMinified: string;
    try {
      codeMinified = await minifyCode(gameCode);
    } catch (minifyError) {
      console.error(
        '[createArcadeGameDraft] Minification failed, using original code:',
        minifyError,
      );
      codeMinified = gameCode;
    }

    // Fetch cover.png - required for submission
    let coverBase64: string | null = null;
    try {
      if (commitSha) {
        const { getFileBase64 } = await import('@/src/lib/utils/github');
        coverBase64 = await getFileBase64(
          githubInfo.username,
          githubInfo.repoName,
          'cover.png',
          commitSha,
        );
      }
    } catch (coverError) {
      console.error(
        '[createArcadeGameDraft] Failed to fetch cover.png:',
        coverError,
      );
      // Continue to check if cover exists
    }

    // Check if cover exists
    if (!coverBase64) {
      return {
        success: false,
        message: 'cover.png is required in your repository root',
      };
    }

    // Validate cover is PNG and has correct dimensions
    const coverDimensions = validatePngAndGetDimensions(coverBase64);
    if (!coverDimensions) {
      return {
        success: false,
        message: 'cover.png must be a valid PNG file',
      };
    }

    if (
      coverDimensions.width !== REQUIRED_COVER_WIDTH ||
      coverDimensions.height !== REQUIRED_COVER_HEIGHT
    ) {
      return {
        success: false,
        message: `cover.png must be exactly ${REQUIRED_COVER_WIDTH}x${REQUIRED_COVER_HEIGHT} pixels (current: ${coverDimensions.width}x${coverDimensions.height})`,
      };
    }

    // Generate unique slug
    const slug = await generateUniqueSlug(metadata.game_name);

    // Compress and upload cover to Vercel Blob
    let coverUrl: string | null = null;
    try {
      const imageBuffer = Buffer.from(coverBase64, 'base64');
      console.log(
        `[createArcadeGameDraft] Image buffer size: ${(imageBuffer.length / 1024).toFixed(1)}KB`,
      );

      let compressedBuffer: Buffer;
      try {
        compressedBuffer = await sharp(imageBuffer)
          .png({
            compressionLevel: 9,
            palette: true,
            quality: 80,
          })
          .toBuffer();
        console.log(
          `[createArcadeGameDraft] Compressed size: ${(compressedBuffer.length / 1024).toFixed(1)}KB`,
        );
      } catch (sharpError) {
        console.error(
          '[createArcadeGameDraft] Sharp compression failed:',
          sharpError,
        );
        return {
          success: false,
          message: `failed to compress cover image: ${sharpError instanceof Error ? sharpError.message : 'unknown error'}`,
        };
      }

      try {
        const blob = await uploadFile({
          key: getArcadeCoverStorageKey(slug),
          body: compressedBuffer,
          access: 'public',
          contentType: 'image/png',
        });
        coverUrl = blob.url;
        console.log(`[createArcadeGameDraft] Uploaded to: ${coverUrl}`);
      } catch (blobError) {
        console.error(
          '[createArcadeGameDraft] Vercel Blob upload failed:',
          blobError,
        );
        return {
          success: false,
          message: `failed to upload cover to storage: ${blobError instanceof Error ? blobError.message : 'unknown error'}`,
        };
      }
    } catch (uploadError) {
      console.error(
        '[createArcadeGameDraft] Failed to upload cover to blob:',
        uploadError,
      );
      return {
        success: false,
        message: `failed to upload cover image: ${uploadError instanceof Error ? uploadError.message : 'unknown error'}`,
      };
    }

    // Create draft in database
    const [game] = await db
      .insert(arcadeGames)
      .values({
        challengeId: challenge.id,
        githubUsername: githubInfo.username,
        repoName: githubInfo.repoName,
        repoUrl,
      })
      .returning();

    await db.insert(arcadeGameVersions).values({
      gameId: game.id,
      slug,
      versionNumber: 1,
      title: metadata.game_name,
      description: metadata.description || null,
      code: gameCode,
      codeMinified,
      coverUrl,
      commitSha,
      commitDate,
    });

    return {
      success: true,
      message: `draft created successfully for "${metadata.game_name}"`,
      gameId: game.id,
      restrictions: restrictionResults,
    };
  } catch (error) {
    console.error('Create draft error:', error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'failed to create draft unexpectedly',
    };
  }
}
