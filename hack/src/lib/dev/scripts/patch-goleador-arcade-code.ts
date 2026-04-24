import { eq } from 'drizzle-orm';
import { readFileSync } from 'fs';
import { join } from 'path';
import { db } from '@/src/lib/db';
import { arcadeGames } from '@/src/lib/db/schema';

async function patchGoleadorArcadeCode() {
  // Read the goleador.js file
  const goleadorPath = join(__dirname, 'patcher', 'goleador.js');
  const arcadeCode = readFileSync(goleadorPath, 'utf-8');

  console.log(`Read goleador.js: ${arcadeCode.length} characters`);

  // Find the goleador game by slug or title
  const game = await db.query.arcadeGames.findFirst({
    where: eq(arcadeGames.slug, 'goleador'),
  });

  if (!game) {
    // Try finding by title if slug doesn't match
    const gameByTitle = await db.query.arcadeGames.findFirst({
      where: eq(arcadeGames.title, 'Goleador'),
    });

    if (!gameByTitle) {
      console.error('Goleador game not found by slug or title');
      console.log('Available games:');
      const allGames = await db.query.arcadeGames.findMany({
        columns: { slug: true, title: true, githubUsername: true },
      });
      allGames.forEach((g) =>
        console.log(`  - ${g.slug} (${g.title}) by ${g.githubUsername}`),
      );
      process.exit(1);
    }

    // Update by title
    await db
      .update(arcadeGames)
      .set({ arcadeCode })
      .where(eq(arcadeGames.id, gameByTitle.id));

    console.log(
      `Successfully updated arcadeCode for: ${gameByTitle.title} (${gameByTitle.slug})`,
    );
    console.log(`Code size: ${arcadeCode.length} characters`);
    return;
  }

  // Update by slug
  await db
    .update(arcadeGames)
    .set({ arcadeCode })
    .where(eq(arcadeGames.id, game.id));

  console.log(
    `Successfully updated arcadeCode for: ${game.title} (${game.slug})`,
  );
  console.log(`Code size: ${arcadeCode.length} characters`);
}

patchGoleadorArcadeCode()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
