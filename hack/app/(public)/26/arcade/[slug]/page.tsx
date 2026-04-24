import { Github } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/src/lib/auth/server';
import {
  getArcade26EmbedUrl,
  getArcadeVotingWindowState,
} from '@/src/lib/utils/arcade';
import {
  getArcadeGamePlayCount,
  getArcadeGameVoteSummary,
  getVersionsForGame,
  resolveArcadeGameSelectionByVersionSlug,
} from '@/src/queries/arcade-games';
import { hasGoogleAccount } from '@/src/queries/users';
import { ArcadeVoteButton } from '../_components/arcade-vote-button';
import { GamePlayer } from './_components/game-player';
import { VersionSelector } from './_components/version-selector';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ version?: string | string[] }>;
}

export async function generateMetadata({
  params,
  searchParams,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const awaitedSearchParams = await searchParams;
  const versionParam = Array.isArray(awaitedSearchParams.version)
    ? awaitedSearchParams.version[0]
    : awaitedSearchParams.version;
  const result = await resolveArcadeGameSelectionByVersionSlug(
    slug,
    versionParam,
  );

  if (!result) {
    return { title: 'Game Not Found' };
  }

  const title = `Platanus Hack 26 Arcade: ${result.version.title}`;
  const description =
    result.version.description ||
    `Play ${result.version.title} by ${result.game.githubUsername}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: result.version.coverUrl
        ? [
            {
              url: result.version.coverUrl,
              alt: result.version.title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: result.version.coverUrl ? 'summary_large_image' : 'summary',
      title,
      description,
      images: result.version.coverUrl ? [result.version.coverUrl] : undefined,
    },
  };
}

export default async function GameShowPage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params;
  const awaitedSearchParams = await searchParams;
  const versionParam = Array.isArray(awaitedSearchParams.version)
    ? awaitedSearchParams.version[0]
    : awaitedSearchParams.version;
  const [result, session] = await Promise.all([
    resolveArcadeGameSelectionByVersionSlug(slug, versionParam),
    getSession(),
  ]);

  if (!result) {
    notFound();
  }

  if (result.shouldRedirectToCanonical) {
    const canonicalSearch = result.canonicalVersionParam
      ? `?version=${encodeURIComponent(result.canonicalVersionParam)}`
      : '';
    redirect(`/26/arcade/${result.canonicalVersionSlug}${canonicalSearch}`);
  }

  const { challenge, game, version, latestVersion } = result;
  const [allVersions, voteSummary, playCount, userHasGoogleAccount] =
    await Promise.all([
      getVersionsForGame(game.id),
      getArcadeGameVoteSummary(game.id, session?.user?.id),
      getArcadeGamePlayCount(game.id),
      session?.user
        ? hasGoogleAccount(session.user.id)
        : Promise.resolve(false),
    ]);
  const currentVersionLabel = `v${version.versionNumber}`;
  const embedUrl = getArcade26EmbedUrl(
    latestVersion.slug,
    version.id === latestVersion.id ? null : currentVersionLabel,
  );
  const votingState = getArcadeVotingWindowState(challenge);
  const _orderedVersions = [
    version,
    ...allVersions.filter((candidate) => candidate.id !== version.id),
  ];

  return (
    <div className="flex h-[100svh] flex-col overflow-hidden font-mono md:h-screen">
      <header className="shrink-0 border-white/[0.06] border-b px-3 py-2 md:px-6 md:py-4">
        <div className="mx-auto flex max-w-[1400px] items-center gap-3 md:gap-5">
          {version.coverUrl && (
            <Image
              src={version.coverUrl}
              alt={version.title}
              width={106}
              height={80}
              className="hidden h-20 w-[106px] shrink-0 rounded-lg border border-white/10 object-cover shadow-lg md:block"
              unoptimized
            />
          )}
          <div className="flex min-w-0 flex-1 flex-col gap-1 md:gap-1.5">
            <Link
              href="/26/arcade"
              className="text-[9px] text-white/60 uppercase tracking-[0.2em] transition-opacity hover:text-primary md:text-[10px] md:tracking-[0.3em]"
            >
              Platanus Hack 26 Arcade
            </Link>
            <div className="flex items-center gap-2 md:gap-3">
              <h1 className="crt-glow truncate font-bold text-base text-primary md:text-2xl">
                {version.title}
              </h1>
              <div className="hidden md:block">
                <VersionSelector
                  gameSlug={latestVersion.slug}
                  versions={allVersions.map((candidate) => ({
                    id: candidate.id,
                    slug: candidate.slug,
                    versionNumber: candidate.versionNumber,
                    compressedSizeKB: (
                      new TextEncoder().encode(candidate.codeMinified).length /
                      1024
                    ).toFixed(2),
                    uploadedAt: candidate.createdAt,
                  }))}
                  currentVersionId={version.id}
                  latestVersionId={latestVersion.id}
                  isLatest={version.id === latestVersion.id}
                  currentVersionNumber={version.versionNumber}
                />
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              <a
                href={
                  version.id === latestVersion.id
                    ? game.repoUrl
                    : `${game.repoUrl}/tree/v${version.versionNumber}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[11px] text-white/60 transition-colors hover:text-primary md:gap-1.5 md:text-xs"
              >
                <Github className="h-3 w-3 md:h-3.5 md:w-3.5" />
                <span className="hidden md:inline">{game.githubUsername}</span>
              </a>
              <div className="md:hidden">
                <VersionSelector
                  gameSlug={latestVersion.slug}
                  versions={allVersions.map((candidate) => ({
                    id: candidate.id,
                    slug: candidate.slug,
                    versionNumber: candidate.versionNumber,
                    compressedSizeKB: (
                      new TextEncoder().encode(candidate.codeMinified).length /
                      1024
                    ).toFixed(2),
                    uploadedAt: candidate.createdAt,
                  }))}
                  currentVersionId={version.id}
                  latestVersionId={latestVersion.id}
                  isLatest={version.id === latestVersion.id}
                  currentVersionNumber={version.versionNumber}
                />
              </div>
              {version.description && (
                <p className="hidden truncate text-white/50 text-xs md:block">
                  {version.description}
                </p>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center">
            <ArcadeVoteButton
              gameId={game.id}
              gameSlug={latestVersion.slug}
              gameTitle={version.title}
              initialVoted={voteSummary.hasVoted}
              initialCount={voteSummary.voteCount}
              isAuthenticated={!!session?.user}
              hasGoogleAccount={userHasGoogleAccount}
              votingOpen={votingState.isOpen}
            />
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 items-center justify-center px-2 pb-2">
        <GamePlayer
          challengeId={challenge.id}
          embedUrl={embedUrl}
          title={version.title}
          gameId={game.id}
          initialPlayCount={playCount}
          playerMode={version.playerMode}
          arcadeMapping={version.arcadeMapping}
        />
      </div>
    </div>
  );
}
