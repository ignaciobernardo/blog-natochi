import { and, eq } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import {
  arcadeChallenges,
  arcadeGames,
  arcadeGameVersions,
  events,
} from '@/src/lib/db/schema';

async function main() {
  const sourceGithubUsername = 'gundurraga';
  const targetGithubUsername = 'play-tracking-e2e';

  const [sourceRow] = await db
    .select({
      game: arcadeGames,
      version: arcadeGameVersions,
    })
    .from(arcadeGames)
    .innerJoin(
      arcadeGameVersions,
      eq(arcadeGameVersions.gameId, arcadeGames.id),
    )
    .innerJoin(
      arcadeChallenges,
      eq(arcadeChallenges.id, arcadeGames.challengeId),
    )
    .innerJoin(events, eq(events.id, arcadeChallenges.eventId))
    .where(
      and(
        eq(events.slug, '25'),
        eq(arcadeGames.githubUsername, sourceGithubUsername),
      ),
    )
    .orderBy(arcadeGameVersions.versionNumber);

  if (!sourceRow) {
    throw new Error(`Source game not found for ${sourceGithubUsername}`);
  }

  const [targetRow] = await db
    .select({
      game: arcadeGames,
      version: arcadeGameVersions,
    })
    .from(arcadeGames)
    .innerJoin(
      arcadeGameVersions,
      eq(arcadeGameVersions.gameId, arcadeGames.id),
    )
    .innerJoin(
      arcadeChallenges,
      eq(arcadeChallenges.id, arcadeGames.challengeId),
    )
    .innerJoin(events, eq(events.id, arcadeChallenges.eventId))
    .where(
      and(
        eq(events.slug, '26'),
        eq(arcadeGames.githubUsername, targetGithubUsername),
      ),
    )
    .orderBy(arcadeGameVersions.versionNumber);

  if (!targetRow) {
    throw new Error(`Target game not found for ${targetGithubUsername}`);
  }

  const [updatedVersion] = await db
    .update(arcadeGameVersions)
    .set({
      title: `${sourceRow.version.title} (E2E)`,
      description: `Copied from Hack 25 game ${sourceRow.game.githubUsername}/${sourceRow.game.repoName} for local validation.`,
      code: sourceRow.version.code,
      codeMinified: sourceRow.version.codeMinified,
      coverUrl: sourceRow.version.coverUrl,
      coverHash: sourceRow.version.coverHash,
      commitSha: sourceRow.version.commitSha,
      commitDate: sourceRow.version.commitDate,
      playerMode: sourceRow.version.playerMode,
      arcadeMapping: sourceRow.version.arcadeMapping,
      updatedAt: new Date(),
    })
    .where(eq(arcadeGameVersions.id, targetRow.version.id))
    .returning();

  console.log(
    JSON.stringify(
      {
        copiedFrom: {
          githubUsername: sourceRow.game.githubUsername,
          versionSlug: sourceRow.version.slug,
          title: sourceRow.version.title,
        },
        copiedTo: {
          githubUsername: targetRow.game.githubUsername,
          versionSlug: updatedVersion.slug,
          title: updatedVersion.title,
        },
        minifiedLength: updatedVersion.codeMinified.length,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    process.exit(0);
  });
