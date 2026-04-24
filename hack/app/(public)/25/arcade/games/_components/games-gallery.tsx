import Image from 'next/image';
import Link from 'next/link';
import type { ArcadeGameFlat } from '@/src/queries/arcade-games';
import { GameModalWrapper } from './game-modal-wrapper';
import { Leaderboard } from './leaderboard';

interface GamesGalleryProps {
  submitted: ArcadeGameFlat[];
  unsubmitted: ArcadeGameFlat[];
  selectedGame: ArcadeGameFlat | null;
}

function formatDate(date: Date | null) {
  if (!date) return 'Never';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getMinifiedSizeKB(codeMinified: string) {
  const sizeBytes = new TextEncoder().encode(codeMinified).length;
  return (sizeBytes / 1024).toFixed(2);
}

function GameCard({ game }: { game: ArcadeGameFlat }) {
  return (
    <Link
      href={`/25/arcade/games?game=${game.slug}`}
      scroll={false}
      className="group hover:-translate-y-1 flex cursor-pointer flex-col gap-3 border-2 border-primary bg-background p-4 transition-all hover:translate-x-1 hover:shadow-[-4px_4px_0px_hsl(var(--primary))]"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-primary/10">
        {game.coverUrl ? (
          <Image
            src={game.coverUrl}
            alt={game.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-primary/10">
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
  );
}

export function GamesGallery({
  submitted,
  unsubmitted,
  selectedGame,
}: GamesGalleryProps) {
  return (
    <>
      <div className="space-y-16">
        {/* Leaderboard */}
        {submitted.length > 0 && <Leaderboard games={submitted} />}

        {/* Submitted Games */}
        {submitted.length > 0 && (
          <section>
            <h2 className="mb-8 font-bold font-title text-2xl text-primary md:text-3xl">
              <span className="bg-primary px-4 py-2 text-background">
                submitted games
              </span>
              <span className="ml-4 text-primary">({submitted.length})</span>
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {submitted.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          </section>
        )}

        {/* Unsubmitted Games */}
        {unsubmitted.length > 0 && (
          <section>
            <h2 className="mb-8 font-bold font-title text-2xl text-primary md:text-3xl">
              <span className="border-2 border-primary bg-background px-4 py-2">
                in progress
              </span>
              <span className="ml-4 text-primary/70">
                ({unsubmitted.length})
              </span>
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {unsubmitted.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {submitted.length === 0 && unsubmitted.length === 0 && (
          <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
            <p className="font-bold font-title text-2xl text-primary">
              No games available yet
            </p>
            <p className="font-title text-foreground/60 text-lg">
              Check back soon for awesome arcade games!
            </p>
          </div>
        )}
      </div>

      {/* Game Modal */}
      {selectedGame && <GameModalWrapper game={selectedGame} />}
    </>
  );
}
