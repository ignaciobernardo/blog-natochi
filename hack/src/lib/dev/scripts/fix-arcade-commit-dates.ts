import { gt } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import { arcadeGames } from '@/src/lib/db/schema';

async function fixArcadeCommitDates() {
  const cutoffDate = new Date('2024-11-10T23:59:59.999Z');

  const gamesToUpdate = await db
    .select({
      id: arcadeGames.id,
      slug: arcadeGames.slug,
      commitDate: arcadeGames.commitDate,
    })
    .from(arcadeGames)
    .where(gt(arcadeGames.commitDate, cutoffDate));

  console.log(
    `Found ${gamesToUpdate.length} games with commit dates past Nov 10`,
  );

  if (gamesToUpdate.length === 0) {
    console.log('No games to update');
    return;
  }

  for (const game of gamesToUpdate) {
    console.log(
      `Updating ${game.slug}: ${game.commitDate?.toISOString()} -> ${cutoffDate.toISOString()}`,
    );
  }

  const _result = await db
    .update(arcadeGames)
    .set({ commitDate: cutoffDate })
    .where(gt(arcadeGames.commitDate, cutoffDate));

  console.log(`Updated ${gamesToUpdate.length} games`);
}

fixArcadeCommitDates()
  .then(() => {
    console.log('Done');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
