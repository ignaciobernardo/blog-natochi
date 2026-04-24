import { and, eq, isNotNull } from 'drizzle-orm';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { db } from '@/src/lib/db';
import { hackerProfiles, hackers, submissions } from '@/src/lib/db/schema';
import {
  getArcadeChallengeByEventSlug,
  getPublicArcadeGames,
} from '@/src/queries/arcade-games';
import { getArcadeEvent } from '../_utils/get-arcade-event';
import { ArcadeMachine } from './_components/arcade-machine';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Arcade Machine | Platanus Hack 25',
  description: 'Play arcade games on the Platanus Hack 25 arcade machine',
};

const ARCADE_GAMES = [
  { githubUsername: 'jcoruiz', rank: 1 as const },
  { githubUsername: 'aberguecio', rank: 2 as const },
  { githubUsername: 'v4rgas', rank: 3 as const },
  { githubUsername: 'Framebuffers', rank: 'honorable' as const },
  { githubUsername: 'gundurraga', rank: 'honorable' as const },
  { githubUsername: 'brunoveinz', rank: 'honorable' as const },
  { githubUsername: 'emersoftware', rank: 'honorable' as const },
  { githubUsername: 'vicevalds', rank: 'honorable' as const },
  { githubUsername: 'Marialuisaclaro', rank: 'honorable' as const },
  { githubUsername: 'MR-Axel', rank: null },
  { githubUsername: 'srdanirz', rank: null },
  { githubUsername: 'ktrilu', rank: null },
  { githubUsername: 'kovlak', rank: null },
  { githubUsername: 'Vokturz', rank: null },
  { githubUsername: 'warleon', rank: null },
  { githubUsername: 'jtvaldivia', rank: null },
  { githubUsername: 'benjavicente', rank: null },
  { githubUsername: 'DiogoFabricioAG', rank: null },
  { githubUsername: 'lpalacios1', rank: null },
  { githubUsername: 'lucasvsj', rank: null },
  { githubUsername: 'paoloose', rank: null },
  { githubUsername: 'rubentd', rank: null },
];

const ALLOWED_USERNAMES = ARCADE_GAMES.map((g) =>
  g.githubUsername.toLowerCase(),
);

export default async function ArcadeMachinePage() {
  const currentEvent = await getArcadeEvent();
  const challenge = await getArcadeChallengeByEventSlug('25');

  if (!currentEvent || !challenge) {
    notFound();
  }

  const submitted = await getPublicArcadeGames(challenge.id);

  // Get onboarded participants for this event
  const onboardedParticipants = await db
    .select({
      github: hackers.github,
    })
    .from(hackerProfiles)
    .innerJoin(hackers, eq(hackerProfiles.hackerId, hackers.id))
    .innerJoin(submissions, eq(hackerProfiles.submissionId, submissions.id))
    .where(
      and(
        eq(submissions.eventId, currentEvent.id),
        isNotNull(hackerProfiles.onboardCompleteAt),
        isNotNull(hackers.github),
      ),
    );

  const onboardedGithubs = new Set(
    onboardedParticipants
      .map((p) => {
        if (!p.github) return null;
        // Extract username from URL like "https://github.com/username"
        const match = p.github.match(/github\.com\/([^/]+)/i);
        return match ? match[1].toLowerCase() : p.github.toLowerCase();
      })
      .filter(Boolean) as string[],
  );

  const filteredGames = submitted.filter((game) =>
    ALLOWED_USERNAMES.includes(game.githubUsername.toLowerCase()),
  );

  const gamesWithRanks = filteredGames.map((game) => {
    const gameConfig = ARCADE_GAMES.find(
      (g) =>
        g.githubUsername.toLowerCase() === game.githubUsername.toLowerCase(),
    );
    return {
      ...game,
      rank: gameConfig?.rank ?? null,
      isParticipant: onboardedGithubs.has(game.githubUsername.toLowerCase()),
    };
  });

  const sortedGames = gamesWithRanks.sort((a, b) => {
    const rankOrder = (rank: number | 'honorable' | null) => {
      if (rank === 1) return 0;
      if (rank === 2) return 1;
      if (rank === 3) return 2;
      if (rank === 'honorable') return 3;
      return 4;
    };
    return rankOrder(a.rank) - rankOrder(b.rank);
  });

  return <ArcadeMachine games={sortedGames} />;
}
