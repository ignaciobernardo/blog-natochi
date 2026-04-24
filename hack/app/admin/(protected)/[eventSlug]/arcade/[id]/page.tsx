import { ArrowLeft, ExternalLink } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { getAdminEventBySlug } from '@/src/lib/admin/events';
import { generateAdminMetadata } from '@/src/lib/admin/metadata';
import { getAdminEventPath } from '@/src/lib/admin/routes';
import { onlyAdmin } from '@/src/lib/auth/server';
import { getArcade26EmbedUrl } from '@/src/lib/utils/arcade';
import {
  getArcadeGamePlayCount,
  getArcadeGameVoteCount,
  getArcadeReleaseDiagnosticsForAdmin,
  getVersionsForGame,
  resolveArcadeGameForChallenge,
} from '@/src/queries/arcade-games';
import { ArcadeMappingEditor } from './_components/arcade-mapping-editor';
import { CoverUpload } from './_components/cover-upload';

interface PageProps {
  params: Promise<{ eventSlug: string; id: string }>;
}

function formatDateTime(value: Date | null) {
  if (!value) {
    return 'N/A';
  }

  return value.toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const result = await resolveArcadeGameForChallenge(id);

  if (!result) {
    return generateAdminMetadata('Arcade Game Not Found');
  }

  return generateAdminMetadata(`Arcade - ${result.latestVersion.title}`);
}

export default async function ArcadeGameDetailPage({ params }: PageProps) {
  const { eventSlug, id } = await params;
  await onlyAdmin();
  await getAdminEventBySlug(eventSlug);

  const result = await resolveArcadeGameForChallenge(id);
  if (!result) {
    notFound();
  }

  const { challenge, game, latestVersion } = result;
  const [versions, voteCount, playCount, diagnostics] = await Promise.all([
    getVersionsForGame(game.id),
    getArcadeGameVoteCount(game.id),
    getArcadeGamePlayCount(game.id),
    getArcadeReleaseDiagnosticsForAdmin({
      challengeId: challenge.id,
      gameId: game.id,
      limit: 12,
    }),
  ]);

  const embedUrl = getArcade26EmbedUrl(latestVersion.slug);
  const publicLatestHref = `/26/arcade/${latestVersion.slug}`;

  return (
    <div className="container mx-auto space-y-6 py-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href={getAdminEventPath(eventSlug, 'arcade')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Arcade Games
          </Link>
        </Button>
        <div>
          <h1 className="font-bold text-3xl tracking-tight">
            {latestVersion.title}
          </h1>
          <p className="text-muted-foreground">
            {game.githubUsername} / {game.repoName}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Versions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-semibold text-2xl">{versions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Validated Plays</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-semibold text-2xl">{playCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Votes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-semibold text-2xl">{voteCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Diagnostics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-semibold text-2xl">{diagnostics.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Game Information</CardTitle>
              <CardDescription>
                Canonical `/26/arcade` game identity for this challenge.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="mb-1 font-medium text-sm">GitHub Username</div>
                <a
                  href={`https://github.com/${game.githubUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                >
                  {game.githubUsername}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              <div>
                <div className="mb-1 font-medium text-sm">Repository</div>
                <a
                  href={game.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                >
                  {game.repoUrl}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              <div>
                <div className="mb-1 font-medium text-sm">Public Page</div>
                <Link
                  href={publicLatestHref as any}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                >
                  {publicLatestHref}
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>

              <div>
                <div className="mb-1 font-medium text-sm">Game ID</div>
                <code className="rounded bg-muted px-2 py-1 text-sm">
                  {game.id}
                </code>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Latest Version</CardTitle>
              <CardDescription>
                This is the version currently shown by default on `/26/arcade`.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">v{latestVersion.versionNumber}</Badge>
                <code className="rounded bg-muted px-2 py-1 text-sm">
                  {latestVersion.slug}
                </code>
              </div>

              <div>
                <div className="mb-1 font-medium text-sm">Title</div>
                <p className="text-sm">{latestVersion.title}</p>
              </div>

              {latestVersion.description && (
                <div>
                  <div className="mb-1 font-medium text-sm">Description</div>
                  <p className="text-sm">{latestVersion.description}</p>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <div className="mb-1 font-medium text-sm">Uploaded At</div>
                  <p className="text-sm">
                    {formatDateTime(latestVersion.createdAt)}
                  </p>
                </div>
                <div>
                  <div className="mb-1 font-medium text-sm">Commit Date</div>
                  <p className="text-sm">
                    {formatDateTime(latestVersion.commitDate)}
                  </p>
                </div>
                <div>
                  <div className="mb-1 font-medium text-sm">Commit SHA</div>
                  <code className="rounded bg-muted px-2 py-1 text-sm">
                    {latestVersion.commitSha ?? 'N/A'}
                  </code>
                </div>
                <div>
                  <div className="mb-1 font-medium text-sm">Player Mode</div>
                  <p className="text-sm">{latestVersion.playerMode}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <div className="mb-1 font-medium text-sm">Code Size</div>
                  <p className="text-sm">
                    {latestVersion.code.length.toLocaleString()} characters
                  </p>
                </div>
                <div>
                  <div className="mb-1 font-medium text-sm">Minified Size</div>
                  <p className="text-sm">
                    {latestVersion.codeMinified.length.toLocaleString()}{' '}
                    characters
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Version History</CardTitle>
              <CardDescription>
                Challenge-scoped release history for this game.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {versions.map((version) => {
                const publicHref = publicLatestHref;

                return (
                  <div
                    key={version.id}
                    className="rounded-lg border p-3 text-sm"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">v{version.versionNumber}</Badge>
                      {version.id === latestVersion.id && (
                        <Badge>Default Public Version</Badge>
                      )}
                      <code className="rounded bg-muted px-2 py-1 text-xs">
                        {version.slug}
                      </code>
                    </div>
                    <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div>
                        <div className="font-medium text-xs uppercase">
                          Uploaded
                        </div>
                        <div>{formatDateTime(version.createdAt)}</div>
                      </div>
                      <div>
                        <div className="font-medium text-xs uppercase">
                          Commit
                        </div>
                        <div>{version.commitSha ?? 'N/A'}</div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <Link
                        href={publicHref as any}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800"
                      >
                        Open public view
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Release Diagnostics</CardTitle>
              <CardDescription>
                Release ingestion history for this game.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {diagnostics.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No diagnostics recorded for this game yet.
                </p>
              ) : (
                diagnostics.map((diagnostic) => (
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
                      <span className="text-muted-foreground">
                        {formatDateTime(diagnostic.createdAt)}
                      </span>
                      {diagnostic.latestVersionNumber && (
                        <span className="text-muted-foreground">
                          latest v{diagnostic.latestVersionNumber}
                        </span>
                      )}
                    </div>
                    <p className="mt-2">{diagnostic.message}</p>
                    <div className="mt-2 text-muted-foreground text-xs">
                      tag {diagnostic.tag}
                    </div>
                    {diagnostic.details && (
                      <pre className="mt-3 overflow-x-auto rounded-md bg-muted p-3 text-xs">
                        {JSON.stringify(diagnostic.details, null, 2)}
                      </pre>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Game Preview</CardTitle>
              <CardDescription>
                Current default public embed for `/26/arcade`.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-hidden rounded-lg border-4 border-primary bg-black">
                <iframe
                  src={embedUrl}
                  title={latestVersion.title}
                  className="h-[600px] w-full"
                  sandbox="allow-scripts"
                  loading="lazy"
                />
              </div>

              <div className="flex gap-2">
                <Button asChild className="flex-1">
                  <Link
                    href={publicLatestHref as any}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View Public Page
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cover Image</CardTitle>
              <CardDescription>
                Upload a cover image for the latest version.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CoverUpload
                gameId={game.id}
                currentCover={latestVersion.coverUrl}
                gameTitle={latestVersion.title}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Arcade Mapping</CardTitle>
              <CardDescription>
                Update the latest version control mapping used by the virtual
                gamepad and iframe input bridge.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ArcadeMappingEditor
                gameId={latestVersion.id}
                currentMapping={latestVersion.arcadeMapping}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
