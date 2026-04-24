'use client';

import confetti from 'canvas-confetti';
import { Award, PartyPopper, Star, Trophy } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/src/components/ui/button';
import type { ArcadeGameFlat } from '@/src/queries/arcade-games';

interface LeaderboardProps {
  games: ArcadeGameFlat[];
}

const WINNER_SLUGS = {
  first: '50k-survivors',
  second: 'battle-arena',
  third: 'sortem',
  honorable: [
    'vibebeater',
    'goleador',
    'brunoveinzs-game',
    'emersoftwares-game',
    'epic-battle',
    'banana-raider',
  ],
};

function getMinifiedSizeKB(codeMinified: string) {
  const sizeBytes = new TextEncoder().encode(codeMinified).length;
  return (sizeBytes / 1024).toFixed(2);
}

function triggerConfetti() {
  const duration = 3000;
  const animationEnd = Date.now() + duration;

  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      clearInterval(interval);
      return;
    }

    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.6 },
      colors: ['#e0ff00', '#000000', '#ffffff'],
    });

    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.6 },
      colors: ['#e0ff00', '#000000', '#ffffff'],
    });
  }, 50);
}

function WinnerCard({
  game,
  place,
  size = 'normal',
}: {
  game: ArcadeGameFlat;
  place: 1 | 2 | 3;
  size?: 'large' | 'normal';
}) {
  const isFirst = place === 1;
  const isSecond = place === 2;
  const _isThird = place === 3;

  const getBorderClass = () => {
    if (isFirst) return 'border-yellow-400 hover:shadow-[-6px_6px_0px_#facc15]';
    if (isSecond) return 'border-gray-400 hover:shadow-[-4px_4px_0px_#9ca3af]';
    return 'border-amber-600 hover:shadow-[-4px_4px_0px_#d97706]';
  };

  const getBgClass = () => {
    if (isFirst) return 'bg-yellow-400/10';
    if (isSecond) return 'bg-gray-400/10';
    return 'bg-amber-600/10';
  };

  const getTextClass = () => {
    if (isFirst) return 'text-yellow-600';
    if (isSecond) return 'text-gray-600';
    return 'text-amber-600';
  };

  const getPlaceLabel = () => {
    if (isFirst) return '1ST PLACE';
    if (isSecond) return '2ND PLACE';
    return '3RD PLACE';
  };

  return (
    <Link
      href={`/25/arcade/games?game=${game.slug}`}
      scroll={false}
      className={`group hover:-translate-y-1 relative flex cursor-pointer flex-col gap-3 border-2 bg-background p-4 transition-all hover:translate-x-1 ${getBorderClass()}`}
    >
      <div className="-top-3 -left-3 absolute z-10">
        {isFirst ? (
          <div className="flex h-10 w-10 items-center justify-center bg-yellow-400">
            <Trophy className="h-6 w-6 text-black" />
          </div>
        ) : isSecond ? (
          <div className="flex h-8 w-8 items-center justify-center bg-gray-400">
            <Award className="h-5 w-5 text-black" />
          </div>
        ) : (
          <div className="flex h-8 w-8 items-center justify-center bg-amber-600">
            <Award className="h-5 w-5 text-black" />
          </div>
        )}
      </div>

      <div
        className={`relative aspect-[4/3] w-full overflow-hidden ${getBgClass()}`}
      >
        {game.coverUrl ? (
          <Image
            src={game.coverUrl}
            alt={game.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span
              className={`px-2 text-center font-bold font-title ${
                size === 'large' ? 'text-2xl' : 'text-xl'
              } ${getTextClass()}`}
            >
              {game.title}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1 text-left">
        <div className="flex items-center gap-2">
          <span className={`font-bold font-title text-xs ${getTextClass()}`}>
            {getPlaceLabel()}
          </span>
        </div>
        <h3
          className={`line-clamp-2 font-bold font-title text-primary ${
            size === 'large' ? 'text-xl' : 'text-base'
          }`}
        >
          {game.title}
        </h3>
        <p className="font-title text-foreground/70 text-sm">
          by {game.githubUsername}
        </p>
        <p className="font-mono text-foreground/60 text-xs">
          {getMinifiedSizeKB(game.codeMinified)} KB
        </p>
      </div>
    </Link>
  );
}

function HonorableCard({ game }: { game: ArcadeGameFlat }) {
  return (
    <Link
      href={`/25/arcade/games?game=${game.slug}`}
      scroll={false}
      className="group hover:-translate-y-1 relative flex cursor-pointer flex-col gap-2 border-2 border-primary/50 bg-background p-3 transition-all hover:translate-x-1 hover:shadow-[-3px_3px_0px_hsl(var(--primary)/0.5)]"
    >
      <div className="-top-2 -left-2 absolute z-10">
        <div className="flex h-6 w-6 items-center justify-center bg-primary/50">
          <Star className="h-3 w-3 text-background" />
        </div>
      </div>

      <div className="relative aspect-[4/3] w-full overflow-hidden bg-primary/5">
        {game.coverUrl ? (
          <Image
            src={game.coverUrl}
            alt={game.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="px-2 text-center font-bold font-title text-primary/70 text-sm">
              {game.title}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-0.5 text-left">
        <h3 className="line-clamp-1 font-bold font-title text-primary text-sm">
          {game.title}
        </h3>
        <p className="font-title text-foreground/60 text-xs">
          by {game.githubUsername}
        </p>
      </div>
    </Link>
  );
}

export function Leaderboard({ games }: LeaderboardProps) {
  const firstPlace = games.find((g) => g.slug === WINNER_SLUGS.first);
  const secondPlace = games.find((g) => g.slug === WINNER_SLUGS.second);
  const thirdPlace = games.find((g) => g.slug === WINNER_SLUGS.third);
  const honorableMentions = WINNER_SLUGS.honorable
    .map((slug) => games.find((g) => g.slug === slug))
    .filter((g): g is ArcadeGameFlat => g !== undefined);

  if (
    !firstPlace &&
    !secondPlace &&
    !thirdPlace &&
    honorableMentions.length === 0
  ) {
    return null;
  }

  return (
    <section className="mb-16">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-bold font-title text-2xl text-primary md:text-3xl">
          <span className="bg-primary px-4 py-2 text-background">
            🏆 leaderboard
          </span>
        </h2>
        <Button
          onClick={triggerConfetti}
          variant="outline"
          className="gap-2 border-2 border-primary"
        >
          <PartyPopper className="h-4 w-4" />
          Celebrate!
        </Button>
      </div>

      <div className="space-y-8">
        {/* First, Second, and Third Place */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {firstPlace && (
            <WinnerCard game={firstPlace} place={1} size="large" />
          )}
          {secondPlace && <WinnerCard game={secondPlace} place={2} />}
          {thirdPlace && <WinnerCard game={thirdPlace} place={3} />}
        </div>

        {/* Honorable Mentions */}
        {honorableMentions.length > 0 && (
          <div>
            <h3 className="mb-4 font-bold font-title text-lg text-primary/80">
              Honorable Mentions
            </h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
              {honorableMentions.map((game) => (
                <HonorableCard key={game.id} game={game} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
