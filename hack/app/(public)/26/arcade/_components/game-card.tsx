'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRef, useState } from 'react';
import type {
  ArcadeGameFlat,
  ArcadeGameVoteSummary,
} from '@/src/queries/arcade-games';
import { ArcadeVoteButton } from './arcade-vote-button';

function formatDate(date: Date | null) {
  if (!date) return 'Never';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/Santiago',
  });
}

function getMinifiedSizeKB(codeMinified: string) {
  const sizeBytes = new TextEncoder().encode(codeMinified).length;
  return (sizeBytes / 1024).toFixed(2);
}

interface GameCardProps {
  game: ArcadeGameFlat;
  voteSummary: ArcadeGameVoteSummary;
  isAuthenticated: boolean;
  hasGoogleAccount: boolean;
  votingOpen: boolean;
}

export function GameCard({
  game,
  voteSummary,
  isAuthenticated,
  hasGoogleAccount,
  votingOpen,
}: GameCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const hasPreview = !!game.gameplayPreviewUrl;

  function handleMouseEnter() {
    setIsHovered(true);
    if (hasPreview && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  }

  function handleMouseLeave() {
    setIsHovered(false);
    if (hasPreview && videoRef.current) {
      videoRef.current.pause();
    }
  }

  return (
    <article
      className="hover:-translate-y-1 flex flex-col gap-3 border-2 border-primary bg-background p-4 transition-all hover:translate-x-1 hover:shadow-[-4px_4px_0px_hsl(var(--primary))]"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Link
        href={`/26/arcade/${game.slug}`}
        className="group flex flex-col gap-3"
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-primary/10">
          {hasPreview && (
            <video
              ref={videoRef}
              src={game.gameplayPreviewUrl ?? ''}
              poster={game.gameplayPosterUrl ?? undefined}
              muted
              loop
              playsInline
              preload="none"
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
                isHovered ? 'opacity-100' : 'opacity-0'
              }`}
            />
          )}
          {game.coverUrl ? (
            <Image
              src={game.coverUrl}
              alt={game.title}
              fill
              className={`object-cover transition-opacity duration-300 ${
                hasPreview && isHovered ? 'opacity-0' : 'opacity-100'
              }`}
            />
          ) : (
            <div
              className={`flex h-full w-full items-center justify-center bg-primary/10 transition-opacity duration-300 ${
                hasPreview && isHovered ? 'opacity-0' : 'opacity-100'
              }`}
            >
              <span className="px-2 text-center font-bold font-title text-primary text-xl">
                {game.title}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1 text-left">
          <h3 className="line-clamp-2 font-bold font-title text-base text-primary">
            {game.title}
          </h3>
          <p className="font-title text-foreground/70 text-sm">
            by {game.githubUsername}
          </p>
          <div className="flex items-center justify-between gap-2">
            <p className="font-title text-foreground/50 text-xs">
              {formatDate(game.commitDate)}
            </p>
            <p className="font-mono text-foreground/60 text-xs">
              {getMinifiedSizeKB(game.codeMinified)} KB
            </p>
          </div>
        </div>
      </Link>

      <div className="flex items-center justify-between gap-3 border-primary/20 border-t pt-3">
        <ArcadeVoteButton
          gameId={game.id}
          gameSlug={game.slug}
          gameTitle={game.title}
          initialVoted={voteSummary.hasVoted}
          initialCount={voteSummary.voteCount}
          isAuthenticated={isAuthenticated}
          hasGoogleAccount={hasGoogleAccount}
          votingOpen={votingOpen}
          compact
        />
        <Link
          href={`/26/arcade/${game.slug}`}
          className="font-title text-[11px] text-primary/70 uppercase tracking-[0.2em] transition-colors hover:text-primary"
        >
          Play
        </Link>
      </div>
    </article>
  );
}
