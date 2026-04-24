import { createHash } from 'node:crypto';
import { appendFile, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { eq, isNotNull } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import {
  arcadeGames,
  hackerFeedback,
  projects,
  teams,
} from '@/src/lib/db/schema';
import {
  getArcadeCoverStorageKey,
  getProjectLogoStorageKey,
} from '@/src/lib/storage/keys';

export type BlobMigrationAssetKind =
  | 'project-logo'
  | 'arcade-cover'
  | 'feedback-media';

export interface BlobMigrationAsset {
  assetId: string;
  kind: BlobMigrationAssetKind;
  recordId: string;
  recordLabel: string;
  field: 'logoUrl' | 'coverUrl' | 'mediaUrls';
  oldUrl: string;
  key: string;
  mediaIndex?: number;
}

export interface BlobMigrationManifestEntry extends BlobMigrationAsset {
  status: 'copied' | 'error';
  copiedAt: string;
  newUrl?: string;
  contentType?: string;
  sizeBytes?: number;
  error?: string;
}

export const DEFAULT_BLOB_MIGRATION_MANIFEST_PATH =
  'tmp/storage-migrations/vercel-blob-to-s3-manifest.ndjson';

const VERCEL_BLOB_HOST_SUFFIX = '.blob.vercel-storage.com';

export function getArgValue(name: string): string | undefined {
  const flag = `--${name}`;
  const inlinePrefix = `${flag}=`;

  for (let i = 0; i < process.argv.length; i++) {
    const arg = process.argv[i];

    if (arg.startsWith(inlinePrefix)) {
      return arg.slice(inlinePrefix.length);
    }

    if (arg === flag) {
      return process.argv[i + 1];
    }
  }

  return undefined;
}

export function hasFlag(name: string): boolean {
  const flag = `--${name}`;
  return process.argv.includes(flag);
}

export function parseKindsArg(): BlobMigrationAssetKind[] | null {
  const kinds = getArgValue('kinds');
  if (!kinds) {
    return null;
  }

  const requestedKinds = kinds
    .split(',')
    .map((kind) => kind.trim())
    .filter(Boolean);

  const validKinds: BlobMigrationAssetKind[] = [
    'project-logo',
    'arcade-cover',
    'feedback-media',
  ];

  for (const kind of requestedKinds) {
    if (!validKinds.includes(kind as BlobMigrationAssetKind)) {
      throw new Error(
        `Invalid kind "${kind}". Expected one of: ${validKinds.join(', ')}`,
      );
    }
  }

  return requestedKinds as BlobMigrationAssetKind[];
}

export function parsePositiveIntegerArg(
  name: string,
  fallback: number,
): number {
  const value = getArgValue(name);
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    throw new Error(`Invalid value for --${name}: "${value}"`);
  }

  return parsed;
}

export function resolveManifestPath(manifestPath?: string): string {
  return path.resolve(
    process.cwd(),
    manifestPath ?? DEFAULT_BLOB_MIGRATION_MANIFEST_PATH,
  );
}

export async function ensureManifestDirectory(
  manifestPath: string,
): Promise<void> {
  await mkdir(path.dirname(manifestPath), { recursive: true });
}

export async function appendManifestEntry(
  manifestPath: string,
  entry: BlobMigrationManifestEntry,
): Promise<void> {
  await ensureManifestDirectory(manifestPath);
  await appendFile(manifestPath, `${JSON.stringify(entry)}\n`, 'utf8');
}

export async function readManifestEntries(
  manifestPath: string,
): Promise<BlobMigrationManifestEntry[]> {
  try {
    const file = await readFile(manifestPath, 'utf8');
    return file
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => JSON.parse(line) as BlobMigrationManifestEntry);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }

    throw error;
  }
}

export function getLatestCopiedEntriesByAssetId(
  entries: BlobMigrationManifestEntry[],
): Map<string, BlobMigrationManifestEntry> {
  const latestEntries = new Map<string, BlobMigrationManifestEntry>();

  for (const entry of entries) {
    if (entry.status === 'copied') {
      latestEntries.set(entry.assetId, entry);
    }
  }

  return latestEntries;
}

export function isVercelBlobUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      url.hostname.endsWith(VERCEL_BLOB_HOST_SUFFIX)
    );
  } catch {
    return false;
  }
}

function decodePathSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

function getDecodedPathname(url: string): string {
  const parsedUrl = new URL(url);
  return parsedUrl.pathname
    .split('/')
    .map((segment) => decodePathSegment(segment))
    .filter(Boolean)
    .join('/');
}

function inferExtensionFromUrl(url: string): string {
  const pathname = getDecodedPathname(url);
  const extension = path.extname(pathname);
  return extension || '';
}

function getFallbackFeedbackMediaKey(
  feedbackId: string,
  mediaIndex: number,
  oldUrl: string,
): string {
  const hash = createHash('sha1').update(oldUrl).digest('hex').slice(0, 12);
  const extension = inferExtensionFromUrl(oldUrl);
  return `feedback-media/migrated/${feedbackId}-${mediaIndex}-${hash}${extension}`;
}

function getFeedbackMediaStorageKey(
  feedbackId: string,
  mediaIndex: number,
  oldUrl: string,
): string {
  const pathname = getDecodedPathname(oldUrl);
  return (
    pathname || getFallbackFeedbackMediaKey(feedbackId, mediaIndex, oldUrl)
  );
}

export async function listBlobMigrationAssets(): Promise<BlobMigrationAsset[]> {
  const [projectRows, arcadeRows, feedbackRows] = await Promise.all([
    db
      .select({
        id: projects.id,
        slug: teams.slug,
        logoUrl: projects.logoUrl,
      })
      .from(projects)
      .innerJoin(teams, eq(projects.teamId, teams.id))
      .where(isNotNull(projects.logoUrl)),
    db
      .select({
        id: arcadeGames.id,
        slug: arcadeGames.slug,
        coverUrl: arcadeGames.coverUrl,
      })
      .from(arcadeGames)
      .where(isNotNull(arcadeGames.coverUrl)),
    db
      .select({
        id: hackerFeedback.id,
        mediaUrls: hackerFeedback.mediaUrls,
      })
      .from(hackerFeedback)
      .where(isNotNull(hackerFeedback.mediaUrls)),
  ]);

  const assets: BlobMigrationAsset[] = [];

  for (const row of projectRows) {
    if (!row.logoUrl || !isVercelBlobUrl(row.logoUrl)) {
      continue;
    }

    assets.push({
      assetId: `project-logo:${row.id}`,
      kind: 'project-logo',
      recordId: row.id,
      recordLabel: row.slug,
      field: 'logoUrl',
      oldUrl: row.logoUrl,
      key: getProjectLogoStorageKey(row.slug),
    });
  }

  for (const row of arcadeRows) {
    if (!row.coverUrl || !isVercelBlobUrl(row.coverUrl)) {
      continue;
    }

    assets.push({
      assetId: `arcade-cover:${row.id}`,
      kind: 'arcade-cover',
      recordId: row.id,
      recordLabel: row.slug,
      field: 'coverUrl',
      oldUrl: row.coverUrl,
      key: getArcadeCoverStorageKey(row.slug),
    });
  }

  for (const row of feedbackRows) {
    const mediaUrls = row.mediaUrls ?? [];

    mediaUrls.forEach((mediaUrl, mediaIndex) => {
      if (!isVercelBlobUrl(mediaUrl)) {
        return;
      }

      assets.push({
        assetId: `feedback-media:${row.id}:${mediaIndex}`,
        kind: 'feedback-media',
        recordId: row.id,
        recordLabel: row.id,
        field: 'mediaUrls',
        oldUrl: mediaUrl,
        key: getFeedbackMediaStorageKey(row.id, mediaIndex, mediaUrl),
        mediaIndex,
      });
    });
  }

  return assets;
}
