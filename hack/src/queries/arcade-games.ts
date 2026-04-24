import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  or,
  sql,
} from 'drizzle-orm';
import { db } from '@/src/lib/db';
import {
  type ArcadeChallenge,
  type ArcadeGame,
  type ArcadeGamePlay,
  type ArcadeGameVersion,
  type ArcadeGameVote,
  type ArcadeReleaseDiagnostic,
  arcadeChallenges,
  arcadeGamePlays,
  arcadeGames,
  arcadeGameVersions,
  arcadeGameVotes,
  arcadeReleaseDiagnostics,
  type Event,
  events,
  type InsertArcadeChallenge,
  type InsertArcadeGame,
  type InsertArcadeGameVersion,
  type InsertArcadeReleaseDiagnostic,
} from '@/src/lib/db/schema';
import { getArcadeVotingWindowState } from '@/src/lib/utils/arcade';

/**
 * Flattened game + latest version for display purposes.
 * Used by legacy /25/arcade routes and new /26/arcade routes.
 */
export type ArcadeGameWithVersion = ArcadeGame & {
  version: ArcadeGameVersion;
};

/**
 * Flat type that merges game + version fields into a single object.
 * Backward-compatible with the old ArcadeGame shape used by legacy /25/ routes.
 */
export type ArcadeGameFlat = {
  id: string;
  challengeId: string;
  githubUsername: string;
  repoName: string;
  repoUrl: string;
  createdAt: Date;
  updatedAt: Date;
  // Version fields (flattened)
  versionId: string;
  versionNumber: number;
  versionCreatedAt: Date;
  slug: string;
  title: string;
  description: string | null;
  code: string;
  codeMinified: string;
  coverUrl: string | null;
  coverHash: string | null;
  commitSha: string | null;
  commitDate: Date | null;
  playerMode: string;
  arcadeMapping: Record<string, string> | null;
  gameplayPreviewUrl: string | null;
  gameplayPosterUrl: string | null;
};

export type ArcadeGameVoteSummary = {
  voteCount: number;
  hasVoted: boolean;
};

export type ArcadeAdminGameReviewRow = ArcadeGameFlat & {
  versionCount: number;
  playCount: number;
  latestVersionCreatedAt: Date;
  lastReleaseStatus: ArcadeReleaseDiagnostic['status'] | null;
  lastReleaseStage: string | null;
  lastReleaseAt: Date | null;
};

export type ArcadeAdminOverview = {
  totalGames: number;
  totalVersions: number;
  totalVotes: number;
  totalValidatedPlays: number;
  successfulReleases: number;
  failedReleases: number;
  latestReleaseAt: Date | null;
};

export type ArcadeReleaseDiagnosticSummary = ArcadeReleaseDiagnostic & {
  gameGithubUsername: string | null;
  latestVersionNumber: number | null;
};

export type ArcadeChallengeWithEvent = ArcadeChallenge & {
  event: Pick<
    Event,
    'id' | 'name' | 'slug' | 'priorityDeadlineAt' | 'finalDeadlineAt'
  >;
};

export type ResolvedArcadeChallengeGameVersion = {
  challenge: ArcadeChallenge;
  game: ArcadeGame;
  version: ArcadeGameVersion;
  latestVersion: ArcadeGameVersion;
};

export type ResolvedArcadeChallengeGameSelection =
  ResolvedArcadeChallengeGameVersion & {
    canonicalVersionSlug: string;
    canonicalVersionParam: string | null;
    shouldRedirectToCanonical: boolean;
  };

export type ResolvedArcadeChallengeGame = {
  challenge: ArcadeChallenge;
  game: ArcadeGame;
  latestVersion: ArcadeGameVersion;
};

function compareFlatGamesBySlugPriority(
  current: ArcadeGameFlat,
  candidate: ArcadeGameFlat,
): ArcadeGameFlat {
  if (!current.commitSha || !candidate.commitSha) {
    return current;
  }

  if (candidate.slug.length !== current.slug.length) {
    return candidate.slug.length < current.slug.length ? candidate : current;
  }

  if (candidate.slug !== current.slug) {
    return candidate.slug < current.slug ? candidate : current;
  }

  return candidate.id < current.id ? candidate : current;
}

function dedupeArcadeGamesByCommitHash(
  games: ArcadeGameFlat[],
): ArcadeGameFlat[] {
  const deduped = new Map<string, ArcadeGameFlat>();
  const withoutCommitSha: ArcadeGameFlat[] = [];

  for (const game of games) {
    if (!game.commitSha) {
      withoutCommitSha.push(game);
      continue;
    }

    const existing = deduped.get(game.commitSha);
    if (!existing) {
      deduped.set(game.commitSha, game);
      continue;
    }

    deduped.set(game.commitSha, compareFlatGamesBySlugPriority(existing, game));
  }

  return [...deduped.values(), ...withoutCommitSha].sort(
    (a, b) => (b.commitDate?.getTime() ?? 0) - (a.commitDate?.getTime() ?? 0),
  );
}

function flattenGameVersion(
  game: ArcadeGame,
  version: ArcadeGameVersion,
): ArcadeGameFlat {
  return {
    id: game.id,
    challengeId: game.challengeId,
    githubUsername: game.githubUsername,
    repoName: game.repoName,
    repoUrl: game.repoUrl,
    createdAt: game.createdAt,
    updatedAt: game.updatedAt,
    versionId: version.id,
    versionNumber: version.versionNumber,
    versionCreatedAt: version.createdAt,
    slug: version.slug,
    title: version.title,
    description: version.description,
    code: version.code,
    codeMinified: version.codeMinified,
    coverUrl: version.coverUrl,
    coverHash: version.coverHash,
    commitSha: version.commitSha,
    commitDate: version.commitDate,
    playerMode: version.playerMode,
    arcadeMapping: version.arcadeMapping,
    gameplayPreviewUrl: version.gameplayPreviewUrl,
    gameplayPosterUrl: version.gameplayPosterUrl,
  };
}

// ---------------------------------------------------------------------------
// Challenges
// ---------------------------------------------------------------------------

export async function getArcadeChallengeByEventSlug(
  eventSlug: string,
): Promise<ArcadeChallenge | null> {
  const [challenge] = await db
    .select({ challenge: arcadeChallenges })
    .from(arcadeChallenges)
    .innerJoin(sql`"events"`, sql`"events"."id" = ${arcadeChallenges.eventId}`)
    .where(sql`"events"."slug" = ${eventSlug}`);
  return challenge?.challenge || null;
}

export async function getArcadeChallengeWithEventByEventSlug(
  eventSlug: string,
): Promise<ArcadeChallengeWithEvent | null> {
  const [row] = await db
    .select({
      challenge: arcadeChallenges,
      event: {
        id: events.id,
        name: events.name,
        slug: events.slug,
        priorityDeadlineAt: events.priorityDeadlineAt,
        finalDeadlineAt: events.finalDeadlineAt,
      },
    })
    .from(arcadeChallenges)
    .innerJoin(events, eq(events.id, arcadeChallenges.eventId))
    .where(eq(events.slug, eventSlug))
    .limit(1);

  if (!row) {
    return null;
  }

  return {
    ...row.challenge,
    event: row.event,
  };
}

export async function getCurrentOrLatestArcadeChallenge(
  now: Date = new Date(),
): Promise<ArcadeChallenge | null> {
  const [activeChallenge] = await db
    .select()
    .from(arcadeChallenges)
    .where(gte(arcadeChallenges.votingDeadline, now))
    .orderBy(arcadeChallenges.submissionDeadline, arcadeChallenges.createdAt)
    .limit(1);

  if (activeChallenge) {
    return activeChallenge;
  }

  const [latestChallenge] = await db
    .select()
    .from(arcadeChallenges)
    .orderBy(
      desc(arcadeChallenges.votingDeadline),
      desc(arcadeChallenges.createdAt),
    )
    .limit(1);

  return latestChallenge || null;
}

export async function getCurrentOrLatestArcadeChallengeWithEvent(
  now: Date = new Date(),
): Promise<ArcadeChallengeWithEvent | null> {
  const [activeRow] = await db
    .select({
      challenge: arcadeChallenges,
      event: {
        id: events.id,
        name: events.name,
        slug: events.slug,
        priorityDeadlineAt: events.priorityDeadlineAt,
        finalDeadlineAt: events.finalDeadlineAt,
      },
    })
    .from(arcadeChallenges)
    .innerJoin(events, eq(events.id, arcadeChallenges.eventId))
    .where(gte(arcadeChallenges.votingDeadline, now))
    .orderBy(arcadeChallenges.submissionDeadline, arcadeChallenges.createdAt)
    .limit(1);

  if (activeRow) {
    return {
      ...activeRow.challenge,
      event: activeRow.event,
    };
  }

  const [latestRow] = await db
    .select({
      challenge: arcadeChallenges,
      event: {
        id: events.id,
        name: events.name,
        slug: events.slug,
        priorityDeadlineAt: events.priorityDeadlineAt,
        finalDeadlineAt: events.finalDeadlineAt,
      },
    })
    .from(arcadeChallenges)
    .innerJoin(events, eq(events.id, arcadeChallenges.eventId))
    .orderBy(
      desc(arcadeChallenges.votingDeadline),
      desc(arcadeChallenges.createdAt),
    )
    .limit(1);

  if (!latestRow) {
    return null;
  }

  return {
    ...latestRow.challenge,
    event: latestRow.event,
  };
}

export async function getArcadeChallengeById(
  id: string,
): Promise<ArcadeChallenge | null> {
  const [challenge] = await db
    .select()
    .from(arcadeChallenges)
    .where(eq(arcadeChallenges.id, id));
  return challenge || null;
}

export async function getArcadeChallengeBySlug(
  slug: string,
): Promise<ArcadeChallenge | null> {
  const [challenge] = await db
    .select()
    .from(arcadeChallenges)
    .where(eq(arcadeChallenges.slug, slug));
  return challenge || null;
}

export async function getArcadeChallengeByEventId(
  eventId: string,
): Promise<ArcadeChallenge | null> {
  const [challenge] = await db
    .select()
    .from(arcadeChallenges)
    .where(eq(arcadeChallenges.eventId, eventId));
  return challenge || null;
}

export async function getAllArcadeChallenges(): Promise<
  ArcadeChallengeWithEvent[]
> {
  const rows = await db
    .select({
      challenge: arcadeChallenges,
      event: {
        id: events.id,
        name: events.name,
        slug: events.slug,
        priorityDeadlineAt: events.priorityDeadlineAt,
        finalDeadlineAt: events.finalDeadlineAt,
      },
    })
    .from(arcadeChallenges)
    .innerJoin(events, eq(events.id, arcadeChallenges.eventId))
    .orderBy(desc(arcadeChallenges.createdAt));

  return rows.map(({ challenge, event }) => ({
    ...challenge,
    event,
  }));
}

export async function createArcadeChallenge(
  data: InsertArcadeChallenge,
): Promise<ArcadeChallenge> {
  const [challenge] = await db
    .insert(arcadeChallenges)
    .values(data)
    .returning();

  return challenge;
}

export async function updateArcadeChallenge(
  id: string,
  data: Partial<InsertArcadeChallenge>,
): Promise<ArcadeChallenge | null> {
  const [challenge] = await db
    .update(arcadeChallenges)
    .set(data)
    .where(eq(arcadeChallenges.id, id))
    .returning();

  return challenge || null;
}

export async function deleteArcadeChallenge(id: string): Promise<void> {
  await db.delete(arcadeChallenges).where(eq(arcadeChallenges.id, id));
}

// ---------------------------------------------------------------------------
// Games
// ---------------------------------------------------------------------------

export async function getArcadeGameById(
  id: string,
): Promise<ArcadeGame | null> {
  const [game] = await db
    .select()
    .from(arcadeGames)
    .where(eq(arcadeGames.id, id));
  return game || null;
}

export async function getArcadeGameByRepo(
  githubUsername: string,
  repoName: string,
  challengeId: string,
): Promise<ArcadeGame | null> {
  const [game] = await db
    .select()
    .from(arcadeGames)
    .where(
      and(
        eq(arcadeGames.githubUsername, githubUsername),
        eq(arcadeGames.repoName, repoName),
        eq(arcadeGames.challengeId, challengeId),
      ),
    );
  return game || null;
}

export async function getArcadeGameByGithubUser(
  githubUsername: string,
  challengeId: string,
): Promise<ArcadeGame | null> {
  const [game] = await db
    .select()
    .from(arcadeGames)
    .where(
      and(
        eq(arcadeGames.githubUsername, githubUsername),
        eq(arcadeGames.challengeId, challengeId),
      ),
    );
  return game || null;
}

export async function getArcadeGameByRepoUrl(
  repoUrl: string,
): Promise<ArcadeGame | null> {
  const [game] = await db
    .select()
    .from(arcadeGames)
    .where(eq(arcadeGames.repoUrl, repoUrl));
  return game || null;
}

// ---------------------------------------------------------------------------
// Versions
// ---------------------------------------------------------------------------

export async function getArcadeGameVersionById(
  id: string,
): Promise<ArcadeGameVersion | null> {
  const [version] = await db
    .select()
    .from(arcadeGameVersions)
    .where(eq(arcadeGameVersions.id, id));
  return version || null;
}

export async function getArcadeGameVersionBySlug(
  slug: string,
): Promise<ArcadeGameVersion | null> {
  const [version] = await db
    .select()
    .from(arcadeGameVersions)
    .where(eq(arcadeGameVersions.slug, slug))
    .orderBy(
      desc(arcadeGameVersions.versionNumber),
      desc(arcadeGameVersions.createdAt),
    )
    .limit(1);
  return version || null;
}

export async function getLatestVersion(
  gameId: string,
): Promise<ArcadeGameVersion | null> {
  const [version] = await db
    .select()
    .from(arcadeGameVersions)
    .where(eq(arcadeGameVersions.gameId, gameId))
    .orderBy(desc(arcadeGameVersions.versionNumber))
    .limit(1);
  return version || null;
}

export async function getVersionsForGame(
  gameId: string,
): Promise<ArcadeGameVersion[]> {
  return db
    .select()
    .from(arcadeGameVersions)
    .where(eq(arcadeGameVersions.gameId, gameId))
    .orderBy(desc(arcadeGameVersions.versionNumber));
}

export async function createArcadeGameVersion(
  data: InsertArcadeGameVersion,
): Promise<ArcadeGameVersion> {
  const [version] = await db
    .insert(arcadeGameVersions)
    .values(data)
    .returning();
  return version;
}

export async function getArcadeGameVersionByCoverHash(
  coverHash: string,
): Promise<ArcadeGameVersion | null> {
  const [version] = await db
    .select()
    .from(arcadeGameVersions)
    .where(eq(arcadeGameVersions.coverHash, coverHash))
    .orderBy(desc(arcadeGameVersions.createdAt))
    .limit(1);
  return version || null;
}

export async function getArcadeGameVersionByCommitSha(
  gameId: string,
  commitSha: string,
): Promise<ArcadeGameVersion | null> {
  const [version] = await db
    .select()
    .from(arcadeGameVersions)
    .where(
      and(
        eq(arcadeGameVersions.gameId, gameId),
        eq(arcadeGameVersions.commitSha, commitSha),
      ),
    )
    .orderBy(desc(arcadeGameVersions.versionNumber))
    .limit(1);
  return version || null;
}

export async function getArcadeGameVersionByNumber(
  gameId: string,
  versionNumber: number,
): Promise<ArcadeGameVersion | null> {
  const [version] = await db
    .select()
    .from(arcadeGameVersions)
    .where(
      and(
        eq(arcadeGameVersions.gameId, gameId),
        eq(arcadeGameVersions.versionNumber, versionNumber),
      ),
    )
    .limit(1);
  return version || null;
}

export async function createArcadeReleaseDiagnostic(
  data: InsertArcadeReleaseDiagnostic,
): Promise<ArcadeReleaseDiagnostic> {
  const [diagnostic] = await db
    .insert(arcadeReleaseDiagnostics)
    .values(data)
    .returning();
  return diagnostic;
}

// ---------------------------------------------------------------------------
// Game + Version (flattened queries for display)
// ---------------------------------------------------------------------------

/**
 * Get a game with its latest version by version slug.
 * If the slug doesn't match the latest version, returns both so the caller can redirect.
 */
export async function getArcadeGameWithVersionBySlug(slug: string): Promise<{
  game: ArcadeGame;
  version: ArcadeGameVersion;
  latestVersion: ArcadeGameVersion;
} | null> {
  const version = await getArcadeGameVersionBySlug(slug);
  if (!version) return null;

  const game = await getArcadeGameById(version.gameId);
  if (!game) return null;

  const latestVersion = await getLatestVersion(game.id);
  if (!latestVersion) return null;

  return { game, version, latestVersion };
}

/**
 * Get a game with its latest version by game ID.
 */
export async function getArcadeGameWithLatestVersion(
  gameId: string,
): Promise<ArcadeGameWithVersion | null> {
  const game = await getArcadeGameById(gameId);
  if (!game) return null;

  const version = await getLatestVersion(game.id);
  if (!version) return null;

  return { ...game, version };
}

export async function resolveArcadeGameVersionBySlug(
  versionSlug: string,
): Promise<ResolvedArcadeChallengeGameVersion | null> {
  const [row] = await db
    .select({
      challenge: arcadeChallenges,
      game: arcadeGames,
      version: arcadeGameVersions,
    })
    .from(arcadeGames)
    .innerJoin(
      arcadeChallenges,
      eq(arcadeChallenges.id, arcadeGames.challengeId),
    )
    .innerJoin(
      arcadeGameVersions,
      eq(arcadeGameVersions.gameId, arcadeGames.id),
    )
    .where(eq(arcadeGameVersions.slug, versionSlug))
    .orderBy(
      desc(arcadeGameVersions.versionNumber),
      desc(arcadeGameVersions.createdAt),
    )
    .limit(1);

  if (!row) {
    return null;
  }

  const latestVersion = await getLatestVersion(row.game.id);
  if (!latestVersion) {
    return null;
  }

  return {
    challenge: row.challenge,
    game: row.game,
    version: row.version,
    latestVersion,
  };
}

export async function resolveArcadeGameSelectionByVersionSlug(
  slug: string,
  requestedVersionLabel?: string | null,
): Promise<ResolvedArcadeChallengeGameSelection | null> {
  const versionSelection = await resolveArcadeGameVersionBySlug(slug);
  if (!versionSelection) {
    return null;
  }

  const versionMatch = requestedVersionLabel?.trim().match(/^v(\d+)$/i);
  const requestedVersionNumber = versionMatch
    ? Number.parseInt(versionMatch[1] ?? '', 10)
    : null;

  const requestedVersion =
    requestedVersionNumber === null
      ? null
      : await getArcadeGameVersionByNumber(
          versionSelection.game.id,
          requestedVersionNumber,
        );

  const selectedVersion = requestedVersion ?? versionSelection.latestVersion;
  const canonicalVersionParam =
    selectedVersion.id === versionSelection.latestVersion.id
      ? null
      : `v${selectedVersion.versionNumber}`;

  return {
    challenge: versionSelection.challenge,
    game: versionSelection.game,
    version: selectedVersion,
    latestVersion: versionSelection.latestVersion,
    canonicalVersionSlug: versionSelection.latestVersion.slug,
    canonicalVersionParam,
    shouldRedirectToCanonical:
      slug !== versionSelection.latestVersion.slug ||
      (requestedVersionLabel?.trim() ?? null) !== canonicalVersionParam,
  };
}

export async function resolveArcadeGameForChallenge(
  gameId: string,
): Promise<ResolvedArcadeChallengeGame | null> {
  const game = await getArcadeGameById(gameId);

  if (!game) {
    return null;
  }

  const challenge = await getArcadeChallengeById(game.challengeId);
  if (!challenge) {
    return null;
  }

  const latestVersion = await getLatestVersion(game.id);
  if (!latestVersion) {
    return null;
  }

  return {
    challenge,
    game,
    latestVersion,
  };
}

/**
 * Get all games with their latest versions for a challenge (flat format).
 * Used by the public gallery and legacy /25/ routes.
 */
export async function getPublicArcadeGames(
  challengeId: string,
): Promise<ArcadeGameFlat[]> {
  const games = await db
    .select()
    .from(arcadeGames)
    .where(eq(arcadeGames.challengeId, challengeId));

  const result: ArcadeGameFlat[] = [];

  for (const game of games) {
    const version = await getLatestVersion(game.id);
    if (version) {
      result.push(flattenGameVersion(game, version));
    }
  }

  return dedupeArcadeGamesByCommitHash(result);
}

/**
 * Get a flat game by its version slug.
 */
export async function getArcadeGameFlatBySlug(
  slug: string,
): Promise<ArcadeGameFlat | null> {
  const version = await getArcadeGameVersionBySlug(slug);
  if (!version) return null;

  const game = await getArcadeGameById(version.gameId);
  if (!game) return null;

  return flattenGameVersion(game, version);
}

/**
 * Get a flat game by game ID (uses latest version).
 */
export async function getArcadeGameFlatById(
  gameId: string,
): Promise<ArcadeGameFlat | null> {
  const game = await getArcadeGameById(gameId);
  if (!game) return null;

  const version = await getLatestVersion(game.id);
  if (!version) return null;

  return flattenGameVersion(game, version);
}

// ---------------------------------------------------------------------------
// Upsert (for sync / submission flow)
// ---------------------------------------------------------------------------

export async function upsertArcadeGame(
  data: InsertArcadeGame,
): Promise<ArcadeGame> {
  const existing = await getArcadeGameByGithubUser(
    data.githubUsername,
    data.challengeId,
  );

  if (!existing) {
    const [game] = await db.insert(arcadeGames).values(data).returning();
    return game;
  }

  const hasChanges =
    existing.repoName !== data.repoName || existing.repoUrl !== data.repoUrl;

  if (!hasChanges) {
    return existing;
  }

  const [updated] = await db
    .update(arcadeGames)
    .set({
      repoName: data.repoName,
      repoUrl: data.repoUrl,
      updatedAt: new Date(),
    })
    .where(eq(arcadeGames.id, existing.id))
    .returning();

  return updated;
}

// ---------------------------------------------------------------------------
// Admin review
// ---------------------------------------------------------------------------

export async function getArcadeGamesForReview({
  page = 1,
  limit = 20,
  search,
  challengeId,
  sortOrder = 'desc',
}: {
  page?: number;
  limit?: number;
  search?: string;
  challengeId?: string;
  sortOrder?: 'asc' | 'desc';
}): Promise<{
  games: ArcadeAdminGameReviewRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> {
  const conditions = [];

  if (challengeId) {
    conditions.push(eq(arcadeGames.challengeId, challengeId));
  }

  if (search) {
    conditions.push(
      or(
        ilike(arcadeGames.githubUsername, `%${search}%`),
        ilike(arcadeGames.repoName, `%${search}%`),
      ),
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalResult] = await db
    .select({ count: count() })
    .from(arcadeGames)
    .where(whereClause);

  const total = totalResult?.count || 0;
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;

  const games = await db
    .select()
    .from(arcadeGames)
    .where(whereClause)
    .orderBy(
      sortOrder === 'desc'
        ? desc(arcadeGames.createdAt)
        : asc(arcadeGames.createdAt),
    )
    .limit(limit)
    .offset(offset);

  const flatGames: ArcadeGameFlat[] = [];
  for (const game of games) {
    const version = await getLatestVersion(game.id);
    if (version) {
      flatGames.push(flattenGameVersion(game, version));
    }
  }

  const gameIds = flatGames.map((game) => game.id);

  const [versionCounts, playCounts, diagnostics] = await Promise.all([
    gameIds.length === 0
      ? Promise.resolve<Array<{ gameId: string; versionCount: number }>>([])
      : db
          .select({
            gameId: arcadeGameVersions.gameId,
            versionCount: count(arcadeGameVersions.id),
          })
          .from(arcadeGameVersions)
          .where(inArray(arcadeGameVersions.gameId, gameIds))
          .groupBy(arcadeGameVersions.gameId),
    gameIds.length === 0
      ? Promise.resolve<Array<{ gameId: string; playCount: number }>>([])
      : db
          .select({
            gameId: arcadeGamePlays.gameId,
            playCount: count(arcadeGamePlays.id),
          })
          .from(arcadeGamePlays)
          .where(inArray(arcadeGamePlays.gameId, gameIds))
          .groupBy(arcadeGamePlays.gameId),
    gameIds.length === 0
      ? Promise.resolve<ArcadeReleaseDiagnostic[]>([])
      : db
          .select()
          .from(arcadeReleaseDiagnostics)
          .where(inArray(arcadeReleaseDiagnostics.gameId, gameIds))
          .orderBy(desc(arcadeReleaseDiagnostics.createdAt)),
  ]);

  const versionCountByGameId = new Map(
    versionCounts.map((row) => [row.gameId, row.versionCount]),
  );
  const playCountByGameId = new Map(
    playCounts.map((row) => [row.gameId, row.playCount]),
  );
  const latestDiagnosticByGameId = new Map<string, ArcadeReleaseDiagnostic>();

  for (const diagnostic of diagnostics) {
    if (!diagnostic.gameId || latestDiagnosticByGameId.has(diagnostic.gameId)) {
      continue;
    }

    latestDiagnosticByGameId.set(diagnostic.gameId, diagnostic);
  }

  const reviewRows: ArcadeAdminGameReviewRow[] = flatGames.map((game) => {
    const latestDiagnostic = latestDiagnosticByGameId.get(game.id);

    return {
      ...game,
      versionCount: versionCountByGameId.get(game.id) ?? 0,
      playCount: playCountByGameId.get(game.id) ?? 0,
      latestVersionCreatedAt: game.versionCreatedAt,
      lastReleaseStatus: latestDiagnostic?.status ?? null,
      lastReleaseStage: latestDiagnostic?.stage ?? null,
      lastReleaseAt: latestDiagnostic?.createdAt ?? null,
    };
  });

  return {
    games: reviewRows,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}

// ---------------------------------------------------------------------------
// Votes
// ---------------------------------------------------------------------------

export async function voteForArcadeGame(
  userId: string,
  gameId: string,
): Promise<ArcadeGameVote> {
  const [vote] = await db
    .insert(arcadeGameVotes)
    .values({ userId, gameId })
    .onConflictDoNothing()
    .returning();
  return vote;
}

export async function removeArcadeGameVote(
  userId: string,
  gameId: string,
): Promise<void> {
  await db
    .delete(arcadeGameVotes)
    .where(
      and(
        eq(arcadeGameVotes.userId, userId),
        eq(arcadeGameVotes.gameId, gameId),
      ),
    );
}

export async function getArcadeGameVoteCount(gameId: string): Promise<number> {
  const [result] = await db
    .select({ count: count() })
    .from(arcadeGameVotes)
    .where(eq(arcadeGameVotes.gameId, gameId));
  return result?.count || 0;
}

export async function hasUserVotedForArcadeGame(
  userId: string,
  gameId: string,
): Promise<boolean> {
  const [vote] = await db
    .select()
    .from(arcadeGameVotes)
    .where(
      and(
        eq(arcadeGameVotes.userId, userId),
        eq(arcadeGameVotes.gameId, gameId),
      ),
    );
  return !!vote;
}

export async function getArcadeGameVoteCounts(
  gameIds: string[],
): Promise<Record<string, number>> {
  if (gameIds.length === 0) {
    return {};
  }

  const results = await db
    .select({
      gameId: arcadeGameVotes.gameId,
      voteCount: count(arcadeGameVotes.id),
    })
    .from(arcadeGameVotes)
    .where(inArray(arcadeGameVotes.gameId, gameIds))
    .groupBy(arcadeGameVotes.gameId);

  return Object.fromEntries(
    gameIds
      .map((gameId) => [gameId, 0])
      .concat(results.map((result) => [result.gameId, result.voteCount])),
  );
}

export async function getUserArcadeGameVotes(
  userId: string,
  gameIds: string[],
): Promise<Set<string>> {
  if (gameIds.length === 0) {
    return new Set();
  }

  const votes = await db
    .select({ gameId: arcadeGameVotes.gameId })
    .from(arcadeGameVotes)
    .where(
      and(
        eq(arcadeGameVotes.userId, userId),
        inArray(arcadeGameVotes.gameId, gameIds),
      ),
    );

  return new Set(votes.map((vote) => vote.gameId));
}

export async function getArcadeGameVoteSummaries(
  gameIds: string[],
  userId?: string,
): Promise<Record<string, ArcadeGameVoteSummary>> {
  if (gameIds.length === 0) {
    return {};
  }

  const voteCounts = await getArcadeGameVoteCounts(gameIds);
  const votedGameIds = userId
    ? await getUserArcadeGameVotes(userId, gameIds)
    : new Set<string>();

  return Object.fromEntries(
    gameIds.map((gameId) => [
      gameId,
      {
        voteCount: voteCounts[gameId] ?? 0,
        hasVoted: votedGameIds.has(gameId),
      },
    ]),
  );
}

export async function getArcadeGameVoteSummary(
  gameId: string,
  userId?: string,
): Promise<ArcadeGameVoteSummary> {
  const summaries = await getArcadeGameVoteSummaries([gameId], userId);
  return summaries[gameId] ?? { voteCount: 0, hasVoted: false };
}

export async function resolveArcadeGameForVoting(gameId: string): Promise<
  | {
      challenge: ArcadeChallenge;
      game: ArcadeGame;
      latestVersion: ArcadeGameVersion;
      votingState: ReturnType<typeof getArcadeVotingWindowState>;
    }
  | {
      error: 'challenge_not_found' | 'game_not_found' | 'game_not_in_challenge';
    }
> {
  const game = await getArcadeGameById(gameId);

  if (!game) {
    return { error: 'game_not_found' };
  }

  const challenge = await getArcadeChallengeById(game.challengeId);
  if (!challenge) {
    return { error: 'challenge_not_found' };
  }

  const latestVersion = await getLatestVersion(game.id);
  if (!latestVersion) {
    return { error: 'game_not_in_challenge' };
  }

  return {
    challenge,
    game,
    latestVersion,
    votingState: getArcadeVotingWindowState(challenge),
  };
}

// ---------------------------------------------------------------------------
// Plays
// ---------------------------------------------------------------------------

export async function recordArcadeGamePlay(
  gameId: string,
  ipAddress: string,
): Promise<ArcadeGamePlay | null> {
  const twentyFourHoursAgoIso = new Date(
    Date.now() - 24 * 60 * 60 * 1000,
  ).toISOString();
  const result = await db.execute(sql<ArcadeGamePlay>`
    INSERT INTO arcade_game_plays (game_id, ip_address)
    SELECT ${gameId}, ${ipAddress}
    WHERE NOT EXISTS (
      SELECT 1
      FROM arcade_game_plays
      WHERE game_id = ${gameId}
        AND ip_address = ${ipAddress}
        AND played_at > ${twentyFourHoursAgoIso}::timestamptz
    )
    RETURNING
      id,
      game_id AS "gameId",
      ip_address AS "ipAddress",
      played_at AS "playedAt"
  `);

  return (result[0] as ArcadeGamePlay | undefined) ?? null;
}

export async function getArcadeGamePlayCount(gameId: string): Promise<number> {
  const [result] = await db
    .select({ count: count() })
    .from(arcadeGamePlays)
    .where(eq(arcadeGamePlays.gameId, gameId));
  return result?.count || 0;
}

export async function getArcadeAdminOverview(
  challengeId: string,
): Promise<ArcadeAdminOverview> {
  const games = await db
    .select({ id: arcadeGames.id })
    .from(arcadeGames)
    .where(eq(arcadeGames.challengeId, challengeId));

  const gameIds = games.map((game) => game.id);
  const inChallengeGames = gameIds.length
    ? inArray(arcadeGameVersions.gameId, gameIds)
    : undefined;
  const inChallengeVotes = gameIds.length
    ? inArray(arcadeGameVotes.gameId, gameIds)
    : undefined;
  const inChallengePlays = gameIds.length
    ? inArray(arcadeGamePlays.gameId, gameIds)
    : undefined;

  const [versionResult, voteResult, playResult, diagnostics] =
    await Promise.all([
      inChallengeGames
        ? db
            .select({ count: count() })
            .from(arcadeGameVersions)
            .where(inChallengeGames)
        : Promise.resolve([{ count: 0 }]),
      inChallengeVotes
        ? db
            .select({ count: count() })
            .from(arcadeGameVotes)
            .where(inChallengeVotes)
        : Promise.resolve([{ count: 0 }]),
      inChallengePlays
        ? db
            .select({ count: count() })
            .from(arcadeGamePlays)
            .where(inChallengePlays)
        : Promise.resolve([{ count: 0 }]),
      db
        .select()
        .from(arcadeReleaseDiagnostics)
        .where(eq(arcadeReleaseDiagnostics.challengeId, challengeId))
        .orderBy(desc(arcadeReleaseDiagnostics.createdAt)),
    ]);

  let successfulReleases = 0;
  let failedReleases = 0;

  for (const diagnostic of diagnostics) {
    if (diagnostic.status === 'succeeded') {
      successfulReleases += 1;
      continue;
    }

    failedReleases += 1;
  }

  return {
    totalGames: gameIds.length,
    totalVersions: versionResult[0]?.count ?? 0,
    totalVotes: voteResult[0]?.count ?? 0,
    totalValidatedPlays: playResult[0]?.count ?? 0,
    successfulReleases,
    failedReleases,
    latestReleaseAt: diagnostics[0]?.createdAt ?? null,
  };
}

export async function getArcadeReleaseDiagnosticsForAdmin({
  challengeId,
  gameId,
  limit = 10,
}: {
  challengeId: string;
  gameId?: string;
  limit?: number;
}): Promise<ArcadeReleaseDiagnosticSummary[]> {
  const conditions = [eq(arcadeReleaseDiagnostics.challengeId, challengeId)];

  if (gameId) {
    conditions.push(eq(arcadeReleaseDiagnostics.gameId, gameId));
  }

  const rows = await db
    .select({
      diagnostic: arcadeReleaseDiagnostics,
      gameGithubUsername: arcadeGames.githubUsername,
      latestVersionNumber: sql<number | null>`(
        select max(${arcadeGameVersions.versionNumber})
        from ${arcadeGameVersions}
        where ${arcadeGameVersions.gameId} = ${arcadeReleaseDiagnostics.gameId}
      )`,
    })
    .from(arcadeReleaseDiagnostics)
    .leftJoin(arcadeGames, eq(arcadeGames.id, arcadeReleaseDiagnostics.gameId))
    .where(and(...conditions))
    .orderBy(desc(arcadeReleaseDiagnostics.createdAt))
    .limit(limit);

  return rows.map((row) => ({
    ...row.diagnostic,
    gameGithubUsername: row.gameGithubUsername ?? null,
    latestVersionNumber: row.latestVersionNumber ?? null,
  }));
}

// ---------------------------------------------------------------------------
// Version mapping update (admin)
// ---------------------------------------------------------------------------

export async function updateArcadeGameVersionMapping(
  versionId: string,
  mapping: Record<string, string>,
): Promise<ArcadeGameVersion | null> {
  const [updated] = await db
    .update(arcadeGameVersions)
    .set({
      arcadeMapping: mapping,
      updatedAt: new Date(),
    })
    .where(eq(arcadeGameVersions.id, versionId))
    .returning();

  return updated || null;
}
