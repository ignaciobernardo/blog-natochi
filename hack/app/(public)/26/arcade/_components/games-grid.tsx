import type {
  ArcadeGameFlat,
  ArcadeGameVoteSummary,
} from '@/src/queries/arcade-games';
import { GameCard } from './game-card';

interface GamesGridProps {
  games: ArcadeGameFlat[];
  voteSummaries: Record<string, ArcadeGameVoteSummary>;
  isAuthenticated: boolean;
  hasGoogleAccount: boolean;
  votingOpen: boolean;
}

export function GamesGrid({
  games,
  voteSummaries,
  isAuthenticated,
  hasGoogleAccount,
  votingOpen,
}: GamesGridProps) {
  if (games.length === 0) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <p className="font-bold font-title text-2xl text-primary">
          No games available yet
        </p>
        <p className="font-title text-foreground/60 text-lg">
          Check back soon for awesome arcade games!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {games.map((game) => (
        <GameCard
          key={game.id}
          game={game}
          voteSummary={
            voteSummaries[game.id] ?? { voteCount: 0, hasVoted: false }
          }
          isAuthenticated={isAuthenticated}
          hasGoogleAccount={hasGoogleAccount}
          votingOpen={votingOpen}
        />
      ))}
    </div>
  );
}
