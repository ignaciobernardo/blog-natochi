import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSession } from '@/src/lib/auth/server';
import { getArcadeVotingWindowState } from '@/src/lib/utils/arcade';
import {
  getArcadeGameVoteSummaries,
  getCurrentOrLatestArcadeChallenge,
  getPublicArcadeGames,
} from '@/src/queries/arcade-games';
import { hasGoogleAccount } from '@/src/queries/users';
import { GamesGrid } from './_components/games-grid';
import { SubmitGameButton } from './_components/submit-game-button';

export const metadata: Metadata = {
  title: 'Arcade Games | Platanus Hack 26',
  description: 'Browse and play all arcade games from Platanus Hack 26',
};

export default async function ArcadeGamesIndexPage() {
  const challenge = await getCurrentOrLatestArcadeChallenge();

  if (!challenge) {
    notFound();
  }

  const session = await getSession();
  const games = await getPublicArcadeGames(challenge.id);
  const voteSummaries = await getArcadeGameVoteSummaries(
    games.map((game) => game.id),
    session?.user?.id,
  );
  const userHasGoogleAccount = session?.user
    ? await hasGoogleAccount(session.user.id)
    : false;
  const votingState = getArcadeVotingWindowState(challenge);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="relative mb-12 flex flex-col gap-6 text-center">
          <div className="z-10 flex justify-center md:absolute md:top-0 md:right-0 md:justify-end">
            <SubmitGameButton />
          </div>
          <Link
            href="/"
            className="relative inline-block transition-opacity hover:opacity-80"
          >
            <h1 className="font-bold font-logo text-4xl lowercase tracking-tighter md:text-5xl lg:text-6xl">
              <span className="font-light text-primary">platanus hack</span>{' '}
              <span className="font-medium text-primary">[26]</span>
            </h1>
          </Link>
          <h2 className="font-bold font-title text-3xl text-primary md:text-4xl lg:text-5xl">
            <span className="bg-primary px-3 py-1 text-background">
              arcade games
            </span>
          </h2>
        </div>

        <GamesGrid
          games={games}
          voteSummaries={voteSummaries}
          isAuthenticated={!!session?.user}
          hasGoogleAccount={userHasGoogleAccount}
          votingOpen={votingState.isOpen}
        />
      </div>
    </div>
  );
}
