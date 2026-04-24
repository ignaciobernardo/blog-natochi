import crypto from 'node:crypto';
import { config } from 'dotenv';
import { eq, isNull } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import { arcadeGameVersions } from '@/src/lib/db/schema';

config({ path: '.env.local' });

function computeSha256(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

async function backfillCodeHash() {
  const versions = await db
    .select({
      id: arcadeGameVersions.id,
      codeMinified: arcadeGameVersions.codeMinified,
    })
    .from(arcadeGameVersions)
    .where(isNull(arcadeGameVersions.codeHash));

  console.log(`Found ${versions.length} versions without codeHash`);

  for (const version of versions) {
    const codeHash = computeSha256(version.codeMinified);
    await db
      .update(arcadeGameVersions)
      .set({ codeHash })
      .where(eq(arcadeGameVersions.id, version.id));

    console.log(`Updated ${version.id} → ${codeHash.slice(0, 12)}...`);
  }

  console.log('Done');
  process.exit(0);
}

backfillCodeHash().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
