/**
 * Usage:
 * npx dotenv-cli -e .env.local -- npx tsx src/lib/dev/scripts/apply-vercel-blob-assets-manifest.ts --manifest tmp/storage-migrations/vercel-blob-to-s3-manifest.ndjson
 * npx dotenv-cli -e .env.production -- npx tsx src/lib/dev/scripts/apply-vercel-blob-assets-manifest.ts --manifest tmp/storage-migrations/vercel-blob-to-s3-manifest.ndjson --write
 */

import { and, eq, inArray } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import { arcadeGames, hackerFeedback, projects } from '@/src/lib/db/schema';
import {
  type BlobMigrationManifestEntry,
  getArgValue,
  getLatestCopiedEntriesByAssetId,
  parseKindsArg,
  readManifestEntries,
  resolveManifestPath,
} from './vercel-blob-s3-migration';

function groupByRecordId(
  entries: BlobMigrationManifestEntry[],
): Map<string, BlobMigrationManifestEntry[]> {
  const groupedEntries = new Map<string, BlobMigrationManifestEntry[]>();

  for (const entry of entries) {
    const existingEntries = groupedEntries.get(entry.recordId) ?? [];
    existingEntries.push(entry);
    groupedEntries.set(entry.recordId, existingEntries);
  }

  return groupedEntries;
}

async function applyProjectEntries(
  entries: BlobMigrationManifestEntry[],
  shouldWrite: boolean,
) {
  if (entries.length === 0) {
    return { applied: 0, skipped: 0 };
  }

  const rows = await db
    .select({
      id: projects.id,
      logoUrl: projects.logoUrl,
    })
    .from(projects)
    .where(
      inArray(
        projects.id,
        entries.map((entry) => entry.recordId),
      ),
    );

  const rowsById = new Map(rows.map((row) => [row.id, row]));

  let applied = 0;
  let skipped = 0;

  for (const entry of entries) {
    const currentRow = rowsById.get(entry.recordId);

    if (!currentRow) {
      skipped += 1;
      console.warn(`skip project ${entry.recordId}: row not found`);
      continue;
    }

    if (currentRow.logoUrl === entry.newUrl) {
      skipped += 1;
      console.log(`skip project ${entry.recordLabel}: already updated`);
      continue;
    }

    if (currentRow.logoUrl !== entry.oldUrl) {
      skipped += 1;
      console.warn(`skip project ${entry.recordLabel}: current URL mismatch`);
      continue;
    }

    if (!shouldWrite) {
      applied += 1;
      console.log(
        `dry-run project ${entry.recordLabel}: ${entry.oldUrl} -> ${entry.newUrl}`,
      );
      continue;
    }

    const updatedRows = await db
      .update(projects)
      .set({ logoUrl: entry.newUrl ?? null })
      .where(
        and(
          eq(projects.id, entry.recordId),
          eq(projects.logoUrl, entry.oldUrl),
        ),
      )
      .returning({ id: projects.id });

    if (updatedRows.length === 1) {
      applied += 1;
      console.log(`updated project ${entry.recordLabel}`);
    } else {
      skipped += 1;
      console.warn(`skip project ${entry.recordLabel}: update affected 0 rows`);
    }
  }

  return { applied, skipped };
}

async function applyArcadeEntries(
  entries: BlobMigrationManifestEntry[],
  shouldWrite: boolean,
) {
  if (entries.length === 0) {
    return { applied: 0, skipped: 0 };
  }

  const rows = await db
    .select({
      id: arcadeGames.id,
      coverUrl: arcadeGames.coverUrl,
    })
    .from(arcadeGames)
    .where(
      inArray(
        arcadeGames.id,
        entries.map((entry) => entry.recordId),
      ),
    );

  const rowsById = new Map(rows.map((row) => [row.id, row]));

  let applied = 0;
  let skipped = 0;

  for (const entry of entries) {
    const currentRow = rowsById.get(entry.recordId);

    if (!currentRow) {
      skipped += 1;
      console.warn(`skip arcade ${entry.recordId}: row not found`);
      continue;
    }

    if (currentRow.coverUrl === entry.newUrl) {
      skipped += 1;
      console.log(`skip arcade ${entry.recordLabel}: already updated`);
      continue;
    }

    if (currentRow.coverUrl !== entry.oldUrl) {
      skipped += 1;
      console.warn(`skip arcade ${entry.recordLabel}: current URL mismatch`);
      continue;
    }

    if (!shouldWrite) {
      applied += 1;
      console.log(
        `dry-run arcade ${entry.recordLabel}: ${entry.oldUrl} -> ${entry.newUrl}`,
      );
      continue;
    }

    const updatedRows = await db
      .update(arcadeGames)
      .set({ coverUrl: entry.newUrl ?? null })
      .where(
        and(
          eq(arcadeGames.id, entry.recordId),
          eq(arcadeGames.coverUrl, entry.oldUrl),
        ),
      )
      .returning({ id: arcadeGames.id });

    if (updatedRows.length === 1) {
      applied += 1;
      console.log(`updated arcade ${entry.recordLabel}`);
    } else {
      skipped += 1;
      console.warn(`skip arcade ${entry.recordLabel}: update affected 0 rows`);
    }
  }

  return { applied, skipped };
}

async function applyFeedbackEntries(
  entries: BlobMigrationManifestEntry[],
  shouldWrite: boolean,
) {
  if (entries.length === 0) {
    return { applied: 0, skipped: 0 };
  }

  const groupedEntries = groupByRecordId(entries);
  const feedbackIds = [...groupedEntries.keys()];

  const rows = await db
    .select({
      id: hackerFeedback.id,
      mediaUrls: hackerFeedback.mediaUrls,
    })
    .from(hackerFeedback)
    .where(inArray(hackerFeedback.id, feedbackIds));

  const rowsById = new Map(rows.map((row) => [row.id, row]));

  let applied = 0;
  let skipped = 0;

  for (const [feedbackId, feedbackEntries] of groupedEntries) {
    const currentRow = rowsById.get(feedbackId);

    if (!currentRow) {
      skipped += feedbackEntries.length;
      console.warn(`skip feedback ${feedbackId}: row not found`);
      continue;
    }

    const currentMediaUrls = currentRow.mediaUrls ?? [];
    const replacements = new Map(
      feedbackEntries
        .filter((entry) => entry.newUrl)
        .map((entry) => [entry.oldUrl, entry.newUrl as string]),
    );

    const nextMediaUrls = currentMediaUrls.map(
      (url) => replacements.get(url) ?? url,
    );
    const matchedReplacementCount = currentMediaUrls.filter((url) =>
      replacements.has(url),
    ).length;

    const didChange =
      JSON.stringify(currentMediaUrls) !== JSON.stringify(nextMediaUrls);

    if (!didChange || matchedReplacementCount === 0) {
      skipped += feedbackEntries.length;
      console.log(`skip feedback ${feedbackId}: no matching Blob URLs left`);
      continue;
    }

    if (!shouldWrite) {
      applied += matchedReplacementCount;
      console.log(
        `dry-run feedback ${feedbackId}: replacing ${matchedReplacementCount} media URL(s)`,
      );
      continue;
    }

    const updatedRows = await db
      .update(hackerFeedback)
      .set({ mediaUrls: nextMediaUrls })
      .where(eq(hackerFeedback.id, feedbackId))
      .returning({ id: hackerFeedback.id });

    if (updatedRows.length === 1) {
      applied += matchedReplacementCount;
      console.log(
        `updated feedback ${feedbackId}: replaced ${matchedReplacementCount} media URL(s)`,
      );
    } else {
      skipped += feedbackEntries.length;
      console.warn(`skip feedback ${feedbackId}: update affected 0 rows`);
    }
  }

  return { applied, skipped };
}

async function main() {
  const manifestPath = resolveManifestPath(getArgValue('manifest'));
  const shouldWrite = process.argv.includes('--write');
  const requestedKinds = parseKindsArg();

  const manifestEntries = await readManifestEntries(manifestPath);
  const latestEntries = [
    ...getLatestCopiedEntriesByAssetId(manifestEntries).values(),
  ];

  const copiedEntries = requestedKinds
    ? latestEntries.filter((entry) => requestedKinds.includes(entry.kind))
    : latestEntries;

  console.log(`Manifest: ${manifestPath}`);
  console.log(`Mode: ${shouldWrite ? 'write' : 'dry-run'}`);
  console.log(`Loaded ${copiedEntries.length} copied entries from manifest.`);

  const projectEntries = copiedEntries.filter(
    (entry) => entry.kind === 'project-logo',
  );
  const arcadeEntries = copiedEntries.filter(
    (entry) => entry.kind === 'arcade-cover',
  );
  const feedbackEntries = copiedEntries.filter(
    (entry) => entry.kind === 'feedback-media',
  );

  const [projectResult, arcadeResult, feedbackResult] = await Promise.all([
    applyProjectEntries(projectEntries, shouldWrite),
    applyArcadeEntries(arcadeEntries, shouldWrite),
    applyFeedbackEntries(feedbackEntries, shouldWrite),
  ]);

  console.log('\nApply phase complete.');
  console.log(
    `Projects: ${projectResult.applied} ${shouldWrite ? 'updated' : 'would update'}, ${projectResult.skipped} skipped`,
  );
  console.log(
    `Arcade: ${arcadeResult.applied} ${shouldWrite ? 'updated' : 'would update'}, ${arcadeResult.skipped} skipped`,
  );
  console.log(
    `Feedback media: ${feedbackResult.applied} ${shouldWrite ? 'updated' : 'would update'}, ${feedbackResult.skipped} skipped`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
