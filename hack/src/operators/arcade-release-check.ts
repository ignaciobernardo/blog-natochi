import crypto from 'node:crypto';
import { minify } from '@swc/core';
import { and, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/src/lib/db';
import { arcadeGames, arcadeGameVersions } from '@/src/lib/db/schema';
import { getFileContent } from '@/src/lib/utils/github';
import { slugify } from '@/src/lib/utils/slugify';

const checkRequestSchema = z.object({
  eventSlug: z.string().trim().min(1).default('26'),
  githubUsername: z.string().trim().min(1),
  repoName: z.string().trim().min(1),
  commitSha: z.string().trim().min(1),
});

type CheckConflicts = {
  code?: string;
  slug?: string;
};

export type ArcadeReleaseCheckResult =
  | {
      available: true;
      slug: string;
      codeHash: string;
    }
  | {
      available: false;
      slug: string;
      codeHash: string;
      conflicts: CheckConflicts;
    };

function computeSha256(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex');
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

async function findGameIdForUser(
  githubUsername: string,
): Promise<string | null> {
  const [game] = await db
    .select({ id: arcadeGames.id })
    .from(arcadeGames)
    .where(eq(arcadeGames.githubUsername, githubUsername))
    .limit(1);

  return game?.id ?? null;
}

async function isCodeHashTaken(
  codeHash: string,
  excludeGameId: string | null,
): Promise<boolean> {
  const conditions = [eq(arcadeGameVersions.codeHash, codeHash)];

  if (excludeGameId) {
    conditions.push(sql`${arcadeGameVersions.gameId} <> ${excludeGameId}`);
  }

  const [match] = await db
    .select({ id: arcadeGameVersions.id })
    .from(arcadeGameVersions)
    .where(and(...conditions))
    .limit(1);

  return !!match;
}

async function isSlugTaken(
  slug: string,
  excludeGameId: string | null,
): Promise<boolean> {
  const conditions = [eq(arcadeGameVersions.slug, slug)];

  if (excludeGameId) {
    conditions.push(sql`${arcadeGameVersions.gameId} <> ${excludeGameId}`);
  }

  const [match] = await db
    .select({ id: arcadeGameVersions.id })
    .from(arcadeGameVersions)
    .where(and(...conditions))
    .limit(1);

  return !!match;
}

export async function checkArcadeRelease(
  rawInput: unknown,
): Promise<ArcadeReleaseCheckResult> {
  const input = checkRequestSchema.parse(rawInput);

  const code = await getFileContent(
    input.githubUsername,
    input.repoName,
    'game.js',
    input.commitSha,
  );

  if (!code || code.trim().length === 0) {
    throw new Error('game.js not found or empty at this commit');
  }

  const metadataContent = await getFileContent(
    input.githubUsername,
    input.repoName,
    'metadata.json',
    input.commitSha,
  );

  if (!metadataContent) {
    throw new Error('metadata.json not found at this commit');
  }

  let parsedMetadata: unknown;
  try {
    parsedMetadata = JSON.parse(metadataContent);
  } catch {
    throw new Error('metadata.json is invalid JSON');
  }

  const metadataResult = z
    .object({ game_name: z.string().trim().min(1) })
    .safeParse(parsedMetadata);

  if (!metadataResult.success) {
    throw new Error('metadata.json must include a valid game_name');
  }

  const gameName = metadataResult.data.game_name;
  const slug = slugify(gameName);

  if (!slug) {
    throw new Error('game_name must produce a valid slug');
  }

  const codeMinified = await minifyCode(code);
  const codeHash = computeSha256(codeMinified);

  const userGameId = await findGameIdForUser(input.githubUsername);

  const [codeTaken, slugTaken] = await Promise.all([
    isCodeHashTaken(codeHash, userGameId),
    isSlugTaken(slug, userGameId),
  ]);

  const conflicts: CheckConflicts = {};

  if (codeTaken) {
    conflicts.code = 'Another game already uses identical code';
  }

  if (slugTaken) {
    conflicts.slug = `Slug "${slug}" is already taken by another game`;
  }

  if (Object.keys(conflicts).length > 0) {
    return { available: false, slug, codeHash, conflicts };
  }

  return { available: true, slug, codeHash };
}
