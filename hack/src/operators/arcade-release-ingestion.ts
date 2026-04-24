import crypto from 'node:crypto';
import { minify } from '@swc/core';
import { and, desc, eq, sql } from 'drizzle-orm';
import sharp from 'sharp';
import { z } from 'zod';
import { db } from '@/src/lib/db';
import type {
  ArcadeChallenge,
  ArcadeGame,
  ArcadeGameVersion,
  ArcadeReleaseDiagnostic,
  InsertArcadeGame,
  InsertArcadeReleaseDiagnostic,
  PlayerMode,
} from '@/src/lib/db/schema';
import { arcadeGames, arcadeGameVersions } from '@/src/lib/db/schema';
import { uploadFile } from '@/src/lib/storage';
import { getArcadeCoverStorageKey } from '@/src/lib/storage/keys';
import { getFileBase64, getFileContent } from '@/src/lib/utils/github';
import { slugify } from '@/src/lib/utils/slugify';
import { checkRestrictions } from '@/src/operators/arcade-game-submission';
import {
  createArcadeReleaseDiagnostic,
  getArcadeChallengeByEventId,
} from '@/src/queries/arcade-games';
import { getEventById, getEventBySlug } from '@/src/queries/events';

const arcadeReleaseTagPattern = /^v[1-9]\d*$/;
const REQUIRED_COVER_WIDTH = 800;
const REQUIRED_COVER_HEIGHT = 600;
const MAX_COVER_BYTES = 500 * 1024;

const releaseRequestSchema = z.object({
  eventSlug: z.string().trim().min(1).default('26'),
  githubUsername: z.string().trim().min(1),
  repoName: z.string().trim().min(1),
  tag: z
    .string()
    .trim()
    .regex(
      arcadeReleaseTagPattern,
      'Release tag must follow the format v1, v2, v3, ...',
    ),
});

const releaseMetadataSchema = z.object({
  game_name: z.string().trim().min(1),
  description: z.string().trim().optional(),
  player_mode: z.enum(['single_player', 'two_player']).optional(),
  arcade_mapping: z.record(z.string(), z.string()).optional(),
});

type ReleaseRequest = z.infer<typeof releaseRequestSchema>;

type ReleaseCommitInfo = {
  sha: string;
  date: Date | null;
};

type ReleaseMetadata = z.infer<typeof releaseMetadataSchema>;
type ReleaseMetadataResult = {
  metadata: ReleaseMetadata;
  raw: string;
};

type ResolvedChallenge = {
  challenge: ArcadeChallenge;
  eventSlug: string;
};

type ReleaseCoverAsset = {
  buffer: Buffer;
  hash: string;
  sourceBase64: string;
};

type CoverDimensions = {
  width: number;
  height: number;
};

type ReleaseContext = {
  eventSlug: string;
  challengeId: string | null;
  gameId: string | null;
  githubUsername: string;
  repoName: string;
  tag: string;
};

type ReleaseFailureDetails = Record<string, unknown>;
type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

class ArcadeReleaseError extends Error {
  readonly status: number;
  readonly stage: string;
  readonly details: ReleaseFailureDetails | undefined;

  constructor(
    stage: string,
    status: number,
    message: string,
    details?: ReleaseFailureDetails,
  ) {
    super(message);
    this.name = 'ArcadeReleaseError';
    this.stage = stage;
    this.status = status;
    this.details = details;
  }
}

export type IngestArcadeReleaseSuccess = {
  success: true;
  game: ArcadeGame;
  version: ArcadeGameVersion;
  created: boolean;
  challenge: ArcadeChallenge;
  eventSlug: string;
  diagnosticId: string | null;
};

export type IngestArcadeReleaseFailure = {
  success: false;
  status: number;
  error: string;
  stage: string;
  details?: ReleaseFailureDetails;
  diagnosticId: string | null;
};

export type IngestArcadeReleaseResult =
  | IngestArcadeReleaseSuccess
  | IngestArcadeReleaseFailure;

export function parseArcadeReleaseRequest(input: unknown): ReleaseRequest {
  return releaseRequestSchema.parse(input);
}

function computeSha256(input: Buffer | string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

function validatePngAndGetDimensions(
  base64Data: string,
): CoverDimensions | null {
  try {
    const buffer = Buffer.from(base64Data, 'base64');
    const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

    for (let index = 0; index < pngSignature.length; index += 1) {
      if (buffer[index] !== pngSignature[index]) {
        return null;
      }
    }

    if (buffer.length < 24) {
      return null;
    }

    return {
      width: buffer.readUInt32BE(16),
      height: buffer.readUInt32BE(20),
    };
  } catch {
    return null;
  }
}

function isArcadeReleaseError(error: unknown): error is ArcadeReleaseError {
  return error instanceof ArcadeReleaseError;
}

function createReleaseError(
  stage: string,
  status: number,
  message: string,
  details?: ReleaseFailureDetails,
): ArcadeReleaseError {
  return new ArcadeReleaseError(stage, status, message, details);
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'unknown';
}

function getExpectedReleaseTag(versionNumber: number): string {
  return `v${versionNumber}`;
}

function parseReleaseTagVersion(tag: string): number {
  const match = tag.match(/^v(\d+)$/);
  if (!match) {
    throw createReleaseError(
      'validate_tag_sequence',
      400,
      'Release tag must follow the format v1, v2, v3, ...',
      { tag },
    );
  }

  return Number.parseInt(match[1] ?? '0', 10);
}

function getGitHubRequestDetails(
  githubUsername: string,
  repoName: string,
  tag: string,
  extras?: ReleaseFailureDetails,
): ReleaseFailureDetails {
  return {
    githubUsername,
    repoName,
    tag,
    repoUrl: `https://github.com/${githubUsername}/${repoName}`,
    ...extras,
  };
}

async function minifyCode(code: string): Promise<string> {
  const result = await minify(code, {
    compress: true,
    mangle: true,
  });

  if (!result.code) {
    throw createReleaseError(
      'minify_code',
      500,
      'Minification returned empty code',
    );
  }

  return result.code;
}

async function resolveChallenge(eventSlug: string): Promise<ResolvedChallenge> {
  const event = await getEventBySlug(eventSlug);

  if (!event) {
    throw createReleaseError(
      'resolve_event',
      404,
      `Event "${eventSlug}" not found`,
      {
        eventSlug,
      },
    );
  }

  const challenge = await getArcadeChallengeByEventId(event.id);
  if (!challenge) {
    throw createReleaseError(
      'resolve_challenge',
      404,
      `Arcade challenge not found for event "${eventSlug}"`,
      { eventId: event.id, eventSlug },
    );
  }

  return {
    challenge,
    eventSlug: event.slug,
  };
}

async function getCommitInfoForTag(
  githubUsername: string,
  repoName: string,
  tag: string,
): Promise<ReleaseCommitInfo> {
  let response: Response;
  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    response = await fetch(
      `https://api.github.com/repos/${githubUsername}/${repoName}/commits/${encodeURIComponent(tag)}`,
      {
        headers,
      },
    );
  } catch (error) {
    throw createReleaseError(
      'fetch_commit',
      502,
      `Failed to fetch commit info for tag "${tag}"`,
      getGitHubRequestDetails(githubUsername, repoName, tag, {
        cause: getErrorMessage(error),
      }),
    );
  }

  if (!response.ok) {
    throw createReleaseError(
      'fetch_commit',
      response.status,
      `Failed to fetch commit info for tag "${tag}"`,
      getGitHubRequestDetails(githubUsername, repoName, tag, {
        responseStatus: response.status,
      }),
    );
  }

  const payload = (await response.json()) as {
    sha?: string;
    commit?: {
      author?: {
        date?: string;
      };
    };
  };

  if (!payload.sha) {
    throw createReleaseError(
      'fetch_commit',
      502,
      `Missing commit SHA for tag "${tag}"`,
      getGitHubRequestDetails(githubUsername, repoName, tag),
    );
  }

  return {
    sha: payload.sha,
    date: payload.commit?.author?.date
      ? new Date(payload.commit.author.date)
      : null,
  };
}

async function getReleaseMetadata(
  githubUsername: string,
  repoName: string,
  tag: string,
): Promise<ReleaseMetadataResult> {
  let metadataContent: string | null;

  try {
    metadataContent = await getFileContent(
      githubUsername,
      repoName,
      'metadata.json',
      tag,
    );
  } catch (error) {
    throw createReleaseError(
      'fetch_metadata',
      502,
      'Failed to fetch metadata.json for this release tag',
      getGitHubRequestDetails(githubUsername, repoName, tag, {
        path: 'metadata.json',
        cause: getErrorMessage(error),
      }),
    );
  }

  if (!metadataContent) {
    throw createReleaseError(
      'fetch_metadata',
      400,
      'metadata.json not found for this release tag',
      getGitHubRequestDetails(githubUsername, repoName, tag, {
        path: 'metadata.json',
      }),
    );
  }

  let parsedMetadata: unknown;
  try {
    parsedMetadata = JSON.parse(metadataContent);
  } catch {
    throw createReleaseError(
      'parse_metadata',
      400,
      'metadata.json is invalid JSON',
      getGitHubRequestDetails(githubUsername, repoName, tag),
    );
  }

  const metadataResult = releaseMetadataSchema.safeParse(parsedMetadata);
  if (!metadataResult.success) {
    throw createReleaseError(
      'validate_metadata',
      400,
      metadataResult.error.issues[0]?.message ?? 'metadata.json is invalid',
      getGitHubRequestDetails(githubUsername, repoName, tag, {
        issues: metadataResult.error.issues,
      }),
    );
  }

  if (metadataResult.data.game_name === '<FILL THIS>') {
    throw createReleaseError(
      'validate_metadata',
      400,
      'metadata.json must include a real game_name',
      getGitHubRequestDetails(githubUsername, repoName, tag),
    );
  }

  return {
    metadata: metadataResult.data,
    raw: metadataContent,
  };
}

async function getReleaseCode(
  githubUsername: string,
  repoName: string,
  tag: string,
): Promise<{ code: string; codeMinified: string }> {
  let code: string | null;

  try {
    code = await getFileContent(githubUsername, repoName, 'game.js', tag);
  } catch (error) {
    throw createReleaseError(
      'fetch_code',
      502,
      'Failed to fetch game.js for this release tag',
      getGitHubRequestDetails(githubUsername, repoName, tag, {
        path: 'game.js',
        cause: getErrorMessage(error),
      }),
    );
  }

  if (!code || code.trim().length === 0) {
    throw createReleaseError(
      'fetch_code',
      400,
      'game.js not found or empty for this release tag',
      getGitHubRequestDetails(githubUsername, repoName, tag, {
        path: 'game.js',
      }),
    );
  }

  const restrictions = await checkRestrictions(code);
  if (!restrictions.passed) {
    throw createReleaseError(
      'validate_code',
      400,
      'game.js failed arcade restrictions',
      getGitHubRequestDetails(githubUsername, repoName, tag, {
        restrictions,
      }),
    );
  }

  const codeMinified = await minifyCode(code);

  return { code, codeMinified };
}

async function getReleaseCoverAsset(
  githubUsername: string,
  repoName: string,
  tag: string,
): Promise<ReleaseCoverAsset> {
  let coverBase64: string | null;

  try {
    coverBase64 = await getFileBase64(
      githubUsername,
      repoName,
      'cover.png',
      tag,
    );
  } catch (error) {
    throw createReleaseError(
      'fetch_cover',
      502,
      'Failed to fetch cover.png for this release tag',
      getGitHubRequestDetails(githubUsername, repoName, tag, {
        path: 'cover.png',
        cause: getErrorMessage(error),
      }),
    );
  }

  if (!coverBase64) {
    throw createReleaseError(
      'fetch_cover',
      400,
      'cover.png not found for this release tag',
      getGitHubRequestDetails(githubUsername, repoName, tag, {
        path: 'cover.png',
      }),
    );
  }

  try {
    const imageBuffer = Buffer.from(coverBase64, 'base64');
    const coverDimensions = validatePngAndGetDimensions(coverBase64);

    if (!coverDimensions) {
      throw createReleaseError(
        'validate_cover',
        400,
        'cover.png must be a valid PNG file',
        getGitHubRequestDetails(githubUsername, repoName, tag, {
          path: 'cover.png',
        }),
      );
    }

    if (
      coverDimensions.width !== REQUIRED_COVER_WIDTH ||
      coverDimensions.height !== REQUIRED_COVER_HEIGHT
    ) {
      throw createReleaseError(
        'validate_cover',
        400,
        `cover.png must be exactly ${REQUIRED_COVER_WIDTH}x${REQUIRED_COVER_HEIGHT} pixels (current: ${coverDimensions.width}x${coverDimensions.height})`,
        getGitHubRequestDetails(githubUsername, repoName, tag, {
          path: 'cover.png',
          width: coverDimensions.width,
          height: coverDimensions.height,
          expectedWidth: REQUIRED_COVER_WIDTH,
          expectedHeight: REQUIRED_COVER_HEIGHT,
        }),
      );
    }

    if (imageBuffer.byteLength > MAX_COVER_BYTES) {
      throw createReleaseError(
        'validate_cover',
        400,
        `cover.png must be 500 KB or less (current: ${(imageBuffer.byteLength / 1024).toFixed(1)} KB)`,
        getGitHubRequestDetails(githubUsername, repoName, tag, {
          path: 'cover.png',
          sizeBytes: imageBuffer.byteLength,
          maxSizeBytes: MAX_COVER_BYTES,
        }),
      );
    }

    const compressedBuffer = await sharp(imageBuffer)
      .png({
        compressionLevel: 9,
        palette: true,
        quality: 80,
      })
      .toBuffer();

    return {
      buffer: compressedBuffer,
      hash: computeSha256(compressedBuffer),
      sourceBase64: coverBase64,
    };
  } catch (error) {
    throw createReleaseError(
      'process_cover',
      400,
      'Failed to process cover.png',
      getGitHubRequestDetails(githubUsername, repoName, tag, {
        cause: error instanceof Error ? error.message : 'unknown',
      }),
    );
  }
}

function getPlayerMode(metadata: ReleaseMetadata): PlayerMode {
  return metadata.player_mode ?? 'single_player';
}

async function getChangedReleaseFiles(input: {
  githubUsername: string;
  repoName: string;
  currentCode: string;
  currentMetadataRaw: string;
  currentCoverBase64: string | null;
  previousTag: string;
}): Promise<string[]> {
  let previousCode: string | null;
  let previousMetadataRaw: string | null;
  let previousCoverBase64: string | null;

  try {
    [previousCode, previousMetadataRaw, previousCoverBase64] =
      await Promise.all([
        getFileContent(
          input.githubUsername,
          input.repoName,
          'game.js',
          input.previousTag,
        ),
        getFileContent(
          input.githubUsername,
          input.repoName,
          'metadata.json',
          input.previousTag,
        ),
        getFileBase64(
          input.githubUsername,
          input.repoName,
          'cover.png',
          input.previousTag,
        ),
      ]);
  } catch (error) {
    throw createReleaseError(
      'validate_release_changes',
      502,
      'Failed to compare submission files with the previous release.',
      getGitHubRequestDetails(
        input.githubUsername,
        input.repoName,
        input.previousTag,
        {
          cause: getErrorMessage(error),
        },
      ),
    );
  }

  const changedFiles: string[] = [];

  if (previousCode !== input.currentCode) {
    changedFiles.push('game.js');
  }

  if (previousMetadataRaw !== input.currentMetadataRaw) {
    changedFiles.push('metadata.json');
  }

  if ((previousCoverBase64 ?? null) !== (input.currentCoverBase64 ?? null)) {
    changedFiles.push('cover.png');
  }

  return changedFiles;
}

async function persistReleaseDiagnostic(
  input: InsertArcadeReleaseDiagnostic,
): Promise<ArcadeReleaseDiagnostic | null> {
  try {
    return await createArcadeReleaseDiagnostic(input);
  } catch (error) {
    console.error(
      '[arcade-release-ingestion] Failed to persist diagnostic:',
      error,
    );
    return null;
  }
}

async function upsertArcadeGameInTx(
  tx: Transaction,
  data: InsertArcadeGame,
): Promise<ArcadeGame> {
  const [existing] = await tx
    .select()
    .from(arcadeGames)
    .where(
      and(
        eq(arcadeGames.githubUsername, data.githubUsername),
        eq(arcadeGames.challengeId, data.challengeId),
      ),
    )
    .limit(1);

  if (!existing) {
    const [game] = await tx.insert(arcadeGames).values(data).returning();
    return game;
  }

  const hasChanges =
    existing.repoName !== data.repoName || existing.repoUrl !== data.repoUrl;

  if (!hasChanges) {
    return existing;
  }

  const [updated] = await tx
    .update(arcadeGames)
    .set({
      repoName: data.repoName,
      repoUrl: data.repoUrl,
      updatedAt: new Date(),
    })
    .where(eq(arcadeGames.id, existing.id))
    .returning();

  return updated;
}

async function resolveReleaseSlugInTx(
  tx: Transaction,
  gameId: string,
  gameName: string,
): Promise<string> {
  const candidateSlug = slugify(gameName);

  if (!candidateSlug) {
    throw createReleaseError(
      'validate_metadata',
      400,
      'metadata.json game_name must produce a valid slug',
      { gameName },
    );
  }

  const [conflictingVersion] = await tx
    .select({
      gameId: arcadeGameVersions.gameId,
    })
    .from(arcadeGameVersions)
    .where(
      and(
        eq(arcadeGameVersions.slug, candidateSlug),
        sql`${arcadeGameVersions.gameId} <> ${gameId}`,
      ),
    )
    .limit(1);

  if (conflictingVersion) {
    throw createReleaseError(
      'validate_slug',
      409,
      `Another arcade game already uses the slug "${candidateSlug}"`,
      {
        gameName,
        slug: candidateSlug,
      },
    );
  }

  return candidateSlug;
}

export async function ingestArcadeRelease(
  rawInput: unknown,
): Promise<IngestArcadeReleaseResult> {
  let context: ReleaseContext | null = null;

  try {
    const input = parseArcadeReleaseRequest(rawInput);
    context = {
      eventSlug: input.eventSlug,
      challengeId: null,
      gameId: null,
      githubUsername: input.githubUsername,
      repoName: input.repoName,
      tag: input.tag,
    };

    const { challenge, eventSlug } = await resolveChallenge(input.eventSlug);
    context = { ...context, eventSlug, challengeId: challenge.id };

    if (new Date() > challenge.submissionDeadline) {
      throw createReleaseError(
        'submission_window',
        409,
        'Arcade submissions are closed for this challenge',
        {
          eventSlug,
          submissionDeadline: challenge.submissionDeadline.toISOString(),
        },
      );
    }

    const repoUrl = `https://github.com/${input.githubUsername}/${input.repoName}`;
    const [commitInfo, metadataResult, codeResult, releaseCover] =
      await Promise.all([
        getCommitInfoForTag(input.githubUsername, input.repoName, input.tag),
        getReleaseMetadata(input.githubUsername, input.repoName, input.tag),
        getReleaseCode(input.githubUsername, input.repoName, input.tag),
        getReleaseCoverAsset(input.githubUsername, input.repoName, input.tag),
      ]);
    const metadata = metadataResult.metadata;

    const createdResult = await db.transaction(async (tx) => {
      const game = await upsertArcadeGameInTx(tx, {
        challengeId: challenge.id,
        githubUsername: input.githubUsername,
        repoName: input.repoName,
        repoUrl,
      });

      await tx.execute(
        sql`select ${arcadeGames.id} from ${arcadeGames} where ${arcadeGames.id} = ${game.id} for update`,
      );

      const [latestVersion] = await tx
        .select()
        .from(arcadeGameVersions)
        .where(eq(arcadeGameVersions.gameId, game.id))
        .orderBy(desc(arcadeGameVersions.versionNumber))
        .limit(1);

      const versionNumber = (latestVersion?.versionNumber ?? 0) + 1;
      const expectedTag = getExpectedReleaseTag(versionNumber);
      const submittedTagVersion = parseReleaseTagVersion(input.tag);

      if (input.tag !== expectedTag || submittedTagVersion !== versionNumber) {
        throw createReleaseError(
          'validate_tag_sequence',
          409,
          `Unexpected release tag "${input.tag}". Expected "${expectedTag}".`,
          {
            submittedTag: input.tag,
            submittedTagVersion,
            expectedTag,
            expectedVersionNumber: versionNumber,
            latestVersionNumber: latestVersion?.versionNumber ?? 0,
          },
        );
      }

      const [existingVersion] = await tx
        .select()
        .from(arcadeGameVersions)
        .where(
          and(
            eq(arcadeGameVersions.gameId, game.id),
            eq(arcadeGameVersions.commitSha, commitInfo.sha),
          ),
        )
        .orderBy(desc(arcadeGameVersions.versionNumber))
        .limit(1);

      if (existingVersion) {
        return {
          game,
          version: existingVersion,
          created: false,
        };
      }

      const slug = await resolveReleaseSlugInTx(
        tx,
        game.id,
        metadata.game_name,
      );

      const codeHash = computeSha256(codeResult.codeMinified);

      const [codeHashConflict] = await tx
        .select({ id: arcadeGameVersions.id })
        .from(arcadeGameVersions)
        .where(
          and(
            eq(arcadeGameVersions.codeHash, codeHash),
            sql`${arcadeGameVersions.gameId} <> ${game.id}`,
          ),
        )
        .limit(1);

      if (codeHashConflict) {
        throw createReleaseError(
          'validate_code_uniqueness',
          409,
          'Another game already uses identical code',
          { codeHash },
        );
      }

      const changedFiles = latestVersion
        ? await getChangedReleaseFiles({
            githubUsername: input.githubUsername,
            repoName: input.repoName,
            currentCode: codeResult.code,
            currentMetadataRaw: metadataResult.raw,
            currentCoverBase64: releaseCover.sourceBase64,
            previousTag: getExpectedReleaseTag(latestVersion.versionNumber),
          })
        : ['game.js', 'metadata.json', 'cover.png'];

      if (latestVersion && changedFiles.length === 0) {
        throw createReleaseError(
          'validate_release_changes',
          409,
          'No submission changes detected since the previous release.',
          {
            comparedFiles: ['game.js', 'metadata.json', 'cover.png'],
            latestVersionId: latestVersion.id,
            latestVersionNumber: latestVersion.versionNumber,
            latestCommitSha: latestVersion.commitSha,
          },
        );
      }

      let coverUrl: string;
      let coverHash: string;

      const [existingCoverVersion] = await tx
        .select({
          coverUrl: arcadeGameVersions.coverUrl,
          coverHash: arcadeGameVersions.coverHash,
        })
        .from(arcadeGameVersions)
        .where(eq(arcadeGameVersions.coverHash, releaseCover.hash))
        .orderBy(desc(arcadeGameVersions.createdAt))
        .limit(1);

      if (existingCoverVersion?.coverUrl) {
        coverUrl = existingCoverVersion.coverUrl;
        coverHash = existingCoverVersion.coverHash ?? releaseCover.hash;
      } else {
        const blob = await uploadFile({
          key: getArcadeCoverStorageKey(slug),
          body: releaseCover.buffer,
          access: 'public',
          contentType: 'image/png',
        });

        coverUrl = blob.url;
        coverHash = releaseCover.hash;
      }

      const [version] = await tx
        .insert(arcadeGameVersions)
        .values({
          gameId: game.id,
          slug,
          versionNumber,
          title: metadata.game_name,
          description: metadata.description ?? null,
          code: codeResult.code,
          codeMinified: codeResult.codeMinified,
          codeHash,
          coverUrl,
          coverHash,
          commitSha: commitInfo.sha,
          commitDate: commitInfo.date,
          playerMode: getPlayerMode(metadata),
          arcadeMapping:
            metadata.arcade_mapping ?? latestVersion?.arcadeMapping ?? null,
        })
        .returning();

      return {
        game,
        version,
        created: true,
      };
    });

    context = { ...context, gameId: createdResult.game.id };

    const successDiagnostic = await persistReleaseDiagnostic({
      eventSlug,
      challengeId: challenge.id,
      gameId: createdResult.game.id,
      githubUsername: input.githubUsername,
      repoName: input.repoName,
      tag: input.tag,
      status: 'succeeded',
      stage: createdResult.created ? 'create_version' : 'dedupe_release',
      message: createdResult.created
        ? `Release v${createdResult.version.versionNumber} ingested`
        : 'Release already ingested for this commit',
      details: {
        commitSha: commitInfo.sha,
        versionId: createdResult.version.id,
        versionNumber: createdResult.version.versionNumber,
        created: createdResult.created,
        coverHash: createdResult.version.coverHash,
      },
    });

    return {
      success: true,
      game: createdResult.game,
      version: createdResult.version,
      created: createdResult.created,
      challenge,
      eventSlug,
      diagnosticId: successDiagnostic?.id ?? null,
    };
  } catch (error) {
    let failure: IngestArcadeReleaseFailure;

    if (error instanceof z.ZodError) {
      failure = {
        success: false,
        status: 400,
        error: error.issues[0]?.message ?? 'Invalid release request',
        stage: 'parse_request',
        details: { issues: error.issues },
        diagnosticId: null,
      };
    } else if (isArcadeReleaseError(error)) {
      failure = {
        success: false,
        status: error.status,
        error: error.message,
        stage: error.stage,
        details: error.details,
        diagnosticId: null,
      };
    } else {
      failure = {
        success: false,
        status: 500,
        error: 'Failed to ingest arcade release',
        stage: 'unknown',
        details: {
          cause: error instanceof Error ? error.message : 'unknown',
        },
        diagnosticId: null,
      };
    }

    const diagnosticContext = context ?? {
      eventSlug: '26',
      challengeId: null,
      gameId: null,
      githubUsername: 'unknown',
      repoName: 'unknown',
      tag: 'unknown',
    };

    const diagnostic = await persistReleaseDiagnostic({
      eventSlug: diagnosticContext.eventSlug,
      challengeId: diagnosticContext.challengeId,
      gameId: diagnosticContext.gameId,
      githubUsername: diagnosticContext.githubUsername,
      repoName: diagnosticContext.repoName,
      tag: diagnosticContext.tag,
      status: 'failed',
      stage: failure.stage,
      message: failure.error,
      details: failure.details ?? null,
    });

    return {
      ...failure,
      diagnosticId: diagnostic?.id ?? null,
    };
  }
}

export async function getArcadeReleaseAdminPath(
  challenge: ArcadeChallenge,
): Promise<string | null> {
  const event = await getEventById(challenge.eventId);
  return event ? `/admin/${event.slug}/arcade` : null;
}

export async function getArcadeReleaseDetailPath(
  challenge: ArcadeChallenge,
  gameId: string,
): Promise<string | null> {
  const event = await getEventById(challenge.eventId);
  return event ? `/admin/${event.slug}/arcade/${gameId}` : null;
}
