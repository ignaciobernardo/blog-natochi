import { eq } from 'drizzle-orm';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { db } from '@/src/lib/db';
import { arcadeGames } from '@/src/lib/db/schema';

async function patchAllArcadeGames() {
  const gamesDir = join(__dirname, 'patcher', 'games');

  // Read all .js files from the games directory
  const gameFiles = readdirSync(gamesDir).filter((file) =>
    file.endsWith('.js'),
  );

  console.log(`Found ${gameFiles.length} game files to process\n`);

  let successCount = 0;
  let errorCount = 0;
  const errors: { file: string; error: string }[] = [];

  for (const gameFile of gameFiles) {
    const slug = gameFile.replace('.js', '');
    const filePath = join(gamesDir, gameFile);

    try {
      // Read the game file
      const arcadeCode = readFileSync(filePath, 'utf-8');

      console.log(`Processing: ${slug}`);
      console.log(`  File size: ${arcadeCode.length} characters`);

      // Find the game by slug
      const game = await db.query.arcadeGames.findFirst({
        where: eq(arcadeGames.slug, slug),
      });

      if (!game) {
        console.log(`  ❌ Game not found in database\n`);
        errorCount++;
        errors.push({ file: gameFile, error: 'Game not found in database' });
        continue;
      }

      // Update the arcadeCode
      await db
        .update(arcadeGames)
        .set({ arcadeCode })
        .where(eq(arcadeGames.id, game.id));

      console.log(`  ✅ Successfully updated: ${game.title}`);
      console.log(
        `  Previous code size: ${game.arcadeCode?.length || 0} chars`,
      );
      console.log(`  New code size: ${arcadeCode.length} chars\n`);
      successCount++;
    } catch (error) {
      console.error(`  ❌ Error processing ${slug}:`, error);
      errorCount++;
      errors.push({
        file: gameFile,
        error: error instanceof Error ? error.message : String(error),
      });
      console.log('');
    }
  }

  // Summary
  console.log('='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total files processed: ${gameFiles.length}`);
  console.log(`✅ Successful updates: ${successCount}`);
  console.log(`❌ Errors: ${errorCount}`);

  if (errors.length > 0) {
    console.log('\nErrors:');
    errors.forEach(({ file, error }) => {
      console.log(`  - ${file}: ${error}`);
    });
  }

  // List all games in database for reference if there were errors
  if (errorCount > 0) {
    console.log('\nGames in database:');
    const allGames = await db.query.arcadeGames.findMany({
      columns: { slug: true, title: true, githubUsername: true },
      orderBy: (games, { asc }) => [asc(games.slug)],
    });
    allGames.forEach((g) =>
      console.log(`  - ${g.slug} (${g.title}) by ${g.githubUsername}`),
    );
  }
}

patchAllArcadeGames()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Script failed:', err);
    process.exit(1);
  });
