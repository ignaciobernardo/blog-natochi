import { Suspense } from 'react';
import { Badge } from '@/src/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { getAdminEventBySlug } from '@/src/lib/admin/events';
import { generateAdminMetadata } from '@/src/lib/admin/metadata';
import { arcadeReviewSearchParamsSchema } from '@/src/lib/schemas/arcade-review.schema';
import { getArcadeVotingWindowState } from '@/src/lib/utils/arcade';
import {
  getArcadeAdminOverview,
  getArcadeChallengeByEventSlug,
  getArcadeGamesForReview,
  getArcadeGameVoteCounts,
  getArcadeReleaseDiagnosticsForAdmin,
} from '@/src/queries/arcade-games';
import { ArcadeGameFilters } from './_components/arcade-game-filters';
import { ArcadeGameTable } from './_components/arcade-game-table';

export const metadata = generateAdminMetadata('Arcade Games');

interface PageProps {
  params: Promise<{ eventSlug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ArcadeGamesPage({
  params,
  searchParams,
}: PageProps) {
  const { eventSlug } = await params;
  const awaitedParams = await searchParams;
  await getAdminEventBySlug(eventSlug);

  const challenge = await getArcadeChallengeByEventSlug(eventSlug);

  const parsedParams = arcadeReviewSearchParamsSchema.parse({
    page: awaitedParams.page,
    limit: awaitedParams.limit,
    search: awaitedParams.search,
    challengeId: challenge?.id,
    sortOrder: awaitedParams.sortOrder,
  });

  const { games, pagination } = await getArcadeGamesForReview({
    page: parsedParams.page,
    limit: parsedParams.limit,
    search: parsedParams.search,
    challengeId: parsedParams.challengeId,
    sortOrder: parsedParams.sortOrder,
  });
  const [voteCounts, overview, recentDiagnostics] = await Promise.all([
    getArcadeGameVoteCounts(games.map((game) => game.id)),
    challenge ? getArcadeAdminOverview(challenge.id) : null,
    challenge
      ? getArcadeReleaseDiagnosticsForAdmin({
          challengeId: challenge.id,
          limit: 8,
        })
      : [],
  ]);
  const votingState = challenge
    ? getArcadeVotingWindowState(challenge)
    : { isOpen: false, votingStarted: false, votingEnded: false };
  const rolloutStateLabel = !challenge
    ? 'Unavailable'
    : !votingState.votingStarted
      ? 'Submissions Open'
      : votingState.isOpen
        ? 'Voting Live'
        : 'Rollout Frozen';

  return (
    <div className="container mx-auto space-y-6 py-8">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">Arcade Games</h1>
        <p className="text-muted-foreground">
          Review the active `/26/arcade` challenge, releases, and rollout state.
        </p>
        {challenge && (
          <div className="mt-3 flex items-center gap-2">
            <Badge variant={votingState.isOpen ? 'default' : 'secondary'}>
              {rolloutStateLabel}
            </Badge>
            <span className="text-muted-foreground text-sm">
              Voting deadline:{' '}
              {challenge.votingDeadline.toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              })}
            </span>
          </div>
        )}
      </div>

      {challenge && overview && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Games</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-semibold text-2xl">
                {overview.totalGames}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Versions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-semibold text-2xl">
                {overview.totalVersions}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Validated Plays</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-semibold text-2xl">
                {overview.totalValidatedPlays}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Votes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-semibold text-2xl">
                {overview.totalVotes}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Release Successes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-semibold text-2xl">
                {overview.successfulReleases}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Release Failures</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-semibold text-2xl">
                {overview.failedReleases}
              </div>
              <p className="mt-1 text-muted-foreground text-xs">
                {overview.latestReleaseAt
                  ? `Latest activity ${overview.latestReleaseAt.toLocaleString(
                      'en-US',
                      {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                      },
                    )}`
                  : 'No release diagnostics yet'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>Loading filters...</div>}>
            <ArcadeGameFilters
              eventSlug={eventSlug}
              initialParams={parsedParams}
            />
          </Suspense>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <ArcadeGameTable
            eventSlug={eventSlug}
            games={games}
            pagination={pagination}
            voteCounts={voteCounts}
          />
        </CardContent>
      </Card>

      {challenge && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Release Diagnostics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentDiagnostics.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No release diagnostics have been recorded for this challenge
                yet.
              </p>
            ) : (
              recentDiagnostics.map((diagnostic) => (
                <div
                  key={diagnostic.id}
                  className="rounded-lg border p-3 text-sm"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant={
                        diagnostic.status === 'succeeded'
                          ? 'default'
                          : 'destructive'
                      }
                    >
                      {diagnostic.status}
                    </Badge>
                    <Badge variant="outline">{diagnostic.stage}</Badge>
                    <span className="font-medium">
                      {diagnostic.githubUsername}/{diagnostic.repoName}
                    </span>
                    <span className="text-muted-foreground">
                      tag {diagnostic.tag}
                    </span>
                    <span className="text-muted-foreground">
                      {diagnostic.createdAt.toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                      })}
                    </span>
                  </div>
                  <p className="mt-2">{diagnostic.message}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
