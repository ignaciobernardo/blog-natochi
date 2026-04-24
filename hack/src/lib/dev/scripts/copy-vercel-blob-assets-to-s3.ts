/**
 * Usage:
 * npx dotenv-cli -e .env.local -- npx tsx src/lib/dev/scripts/copy-vercel-blob-assets-to-s3.ts
 * npx dotenv-cli -e .env.local -- npx tsx src/lib/dev/scripts/copy-vercel-blob-assets-to-s3.ts --manifest tmp/blob-to-s3.ndjson --kinds project-logo,arcade-cover --limit 20
 */

import { uploadFile } from '@/src/lib/storage';
import {
  appendManifestEntry,
  type BlobMigrationAsset,
  type BlobMigrationManifestEntry,
  getArgValue,
  getLatestCopiedEntriesByAssetId,
  listBlobMigrationAssets,
  parseKindsArg,
  parsePositiveIntegerArg,
  readManifestEntries,
  resolveManifestPath,
} from './vercel-blob-s3-migration';

function normalizeContentType(value: string | null): string | undefined {
  if (!value) {
    return undefined;
  }

  return value.split(';', 1)[0]?.trim() || undefined;
}

async function copyAssetToS3(
  asset: BlobMigrationAsset,
): Promise<BlobMigrationManifestEntry> {
  try {
    const response = await fetch(asset.oldUrl);
    if (!response.ok) {
      throw new Error(
        `Failed to download source asset: ${response.status} ${response.statusText}`,
      );
    }

    const body = await response.arrayBuffer();
    const contentType = normalizeContentType(
      response.headers.get('content-type'),
    );

    const uploaded = await uploadFile({
      key: asset.key,
      body,
      access: 'public',
      contentType,
    });

    return {
      ...asset,
      status: 'copied',
      copiedAt: new Date().toISOString(),
      newUrl: uploaded.url,
      contentType,
      sizeBytes: body.byteLength,
    };
  } catch (error) {
    return {
      ...asset,
      status: 'error',
      copiedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function main() {
  if (process.env.STORAGE_PROVIDER !== 's3') {
    throw new Error(
      'This script must run with STORAGE_PROVIDER=s3 so uploads go to S3.',
    );
  }

  const manifestPath = resolveManifestPath(getArgValue('manifest'));
  const concurrency = parsePositiveIntegerArg('concurrency', 5);
  const limit = parsePositiveIntegerArg('limit', Number.MAX_SAFE_INTEGER);
  const requestedKinds = parseKindsArg();

  const existingEntries = await readManifestEntries(manifestPath);
  const completedEntries = getLatestCopiedEntriesByAssetId(existingEntries);
  const completedAssetIds = new Set(completedEntries.keys());

  let assets = await listBlobMigrationAssets();

  if (requestedKinds) {
    assets = assets.filter((asset) => requestedKinds.includes(asset.kind));
  }

  const pendingAssets = assets
    .filter((asset) => !completedAssetIds.has(asset.assetId))
    .slice(0, limit);

  console.log(`Manifest: ${manifestPath}`);
  console.log(`Found ${assets.length} Blob-backed assets in the database.`);
  console.log(
    `Skipping ${completedAssetIds.size} assets already copied in this manifest.`,
  );
  console.log(
    `Copying ${pendingAssets.length} assets to S3 with concurrency ${concurrency}.`,
  );

  let copiedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < pendingAssets.length; i += concurrency) {
    const batch = pendingAssets.slice(i, i + concurrency);
    const batchEntries = await Promise.all(batch.map(copyAssetToS3));

    for (const entry of batchEntries) {
      await appendManifestEntry(manifestPath, entry);

      if (entry.status === 'copied') {
        copiedCount += 1;
        console.log(
          `copied ${entry.kind} ${entry.recordLabel} -> ${entry.key}`,
        );
      } else {
        errorCount += 1;
        console.error(
          `error ${entry.kind} ${entry.recordLabel}: ${entry.error}`,
        );
      }
    }
  }

  console.log('\nCopy phase complete.');
  console.log(`Copied: ${copiedCount}`);
  console.log(`Errors: ${errorCount}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
