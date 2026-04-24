import { eq, isNull } from 'drizzle-orm';
import sharp from 'sharp';
import { db } from '@/src/lib/db';
import { arcadeGames } from '@/src/lib/db/schema';
import { uploadFile } from '@/src/lib/storage';
import { getArcadeCoverStorageKey } from '@/src/lib/storage/keys';
import { getFileBase64 } from '@/src/lib/utils/github';

const CONCURRENCY_LIMIT = 10;

interface ProcessResult {
  status: 'success' | 'skipped' | 'error';
  slug: string;
  message?: string;
}

async function processGame(game: {
  id: string;
  slug: string;
  githubUsername: string;
  repoName: string;
  commitSha: string | null;
  coverUrl: string | null;
}): Promise<ProcessResult> {
  try {
    if (game.coverUrl) {
      return {
        status: 'skipped',
        slug: game.slug,
        message: 'already has coverUrl',
      };
    }

    // Fetch cover from GitHub
    const coverBase64 = await getFileBase64(
      game.githubUsername,
      game.repoName,
      'cover.png',
      game.commitSha || undefined,
    );

    if (!coverBase64) {
      return {
        status: 'skipped',
        slug: game.slug,
        message: 'no cover.png in repo',
      };
    }

    const imageBuffer = Buffer.from(coverBase64, 'base64');
    const originalSize = imageBuffer.length;

    const compressedBuffer = await sharp(imageBuffer)
      .png({
        compressionLevel: 9,
        palette: true,
        quality: 80,
      })
      .toBuffer();

    const compressedSize = compressedBuffer.length;
    const savings = ((1 - compressedSize / originalSize) * 100).toFixed(1);

    const blob = await uploadFile({
      key: getArcadeCoverStorageKey(game.slug),
      body: compressedBuffer,
      access: 'public',
      contentType: 'image/png',
    });

    await db
      .update(arcadeGames)
      .set({ coverUrl: blob.url })
      .where(eq(arcadeGames.id, game.id));

    console.log(
      `✓ ${game.slug}: ${(originalSize / 1024).toFixed(1)}KB → ${(compressedSize / 1024).toFixed(1)}KB (${savings}% reduction)`,
    );

    return { status: 'success', slug: game.slug };
  } catch (error) {
    console.error(`✗ ${game.slug}:`, error);
    return { status: 'error', slug: game.slug, message: String(error) };
  }
}

async function migrateCoverToBlob() {
  console.log('Starting cover migration to Vercel Blob...');

  // Get all games that don't have a coverUrl yet
  const games = await db
    .select({
      id: arcadeGames.id,
      slug: arcadeGames.slug,
      githubUsername: arcadeGames.githubUsername,
      repoName: arcadeGames.repoName,
      commitSha: arcadeGames.commitSha,
      coverUrl: arcadeGames.coverUrl,
    })
    .from(arcadeGames)
    .where(isNull(arcadeGames.coverUrl));

  console.log(
    `Found ${games.length} games without covers to migrate (concurrency: ${CONCURRENCY_LIMIT})\n`,
  );

  const results: ProcessResult[] = [];

  // Process in batches
  for (let i = 0; i < games.length; i += CONCURRENCY_LIMIT) {
    const batch = games.slice(i, i + CONCURRENCY_LIMIT);
    const batchResults = await Promise.all(batch.map(processGame));
    results.push(...batchResults);
  }

  const successCount = results.filter((r) => r.status === 'success').length;
  const skipCount = results.filter((r) => r.status === 'skipped').length;
  const errorCount = results.filter((r) => r.status === 'error').length;

  console.log('\nMigration complete!');
  console.log(`  Success: ${successCount}`);
  console.log(`  Skipped: ${skipCount}`);
  console.log(`  Errors: ${errorCount}`);

  if (errorCount > 0) {
    console.log('\nFailed games:');
    results
      .filter((r) => r.status === 'error')
      .forEach((r) => console.log(`  - ${r.slug}: ${r.message}`));
  }
}

migrateCoverToBlob()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
