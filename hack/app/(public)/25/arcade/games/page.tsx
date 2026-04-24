import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getArcadeChallengeByEventSlug,
  getPublicArcadeGames,
} from '@/src/queries/arcade-games';
import { GamesGallery } from './_components/games-gallery';
import { SubmitGameButton } from './_components/submit-game-button';

interface PageProps {
  searchParams: Promise<{ game?: string }>;
}

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const { game: gameSlug } = await searchParams;

  if (gameSlug) {
    const challenge = await getArcadeChallengeByEventSlug('25');
    if (challenge) {
      const allGames = await getPublicArcadeGames(challenge.id);
      const selectedGame = allGames.find((g) => g.slug === gameSlug);

      if (selectedGame) {
        return {
          title: `${selectedGame.title} | Arcade Games | Platanus Hack 25`,
          description:
            selectedGame.description ||
            `Play ${selectedGame.title} by ${selectedGame.githubUsername}`,
        };
      }
    }
  }

  return {
    title: 'Arcade Games Gallery | Platanus Hack 25',
    description:
      'Browse and play all arcade games submitted to Platanus Hack 25',
  };
}

export default async function GamesGalleryPage({ searchParams }: PageProps) {
  const { game: gameSlug } = await searchParams;
  const challenge = await getArcadeChallengeByEventSlug('25');

  if (!challenge) {
    notFound();
  }

  const allGames = await getPublicArcadeGames(challenge.id);

  const selectedGame = gameSlug
    ? (allGames.find((g) => g.slug === gameSlug) ?? null)
    : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container relative mx-auto px-4 py-12 md:py-16">
        {/* Submit Button - Top Right on Desktop, Below Title on Mobile */}
        <div className="absolute top-12 right-4 z-20 hidden md:top-16 md:block">
          <SubmitGameButton variant="desktop" />
        </div>
        <div className="mb-12 flex flex-col gap-6 text-center">
          <Link
            href="/25/arcade"
            className="inline-block transition-opacity hover:opacity-80"
          >
            <h1 className="font-bold font-logo text-4xl lowercase tracking-tighter md:text-5xl lg:text-6xl">
              <span className="font-light text-primary">platanus hack</span>{' '}
              <span className="font-medium text-primary">[25]</span>
            </h1>
          </Link>
          <h2 className="font-bold font-title text-3xl text-primary md:text-4xl lg:text-5xl">
            <span className="bg-primary px-3 py-1 text-background">
              arcade games
            </span>
          </h2>
          {/* Submit Button - Mobile Only (Below Title) */}
          <div className="flex justify-center md:hidden">
            <SubmitGameButton variant="mobile" />
          </div>
        </div>

        <GamesGallery
          submitted={allGames}
          unsubmitted={[]}
          selectedGame={selectedGame}
        />
      </div>
    </div>
  );
}
