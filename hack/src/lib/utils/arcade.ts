import { isDevelopmentEnvironment } from '@/src/lib/constants';
import type { ArcadeChallenge } from '@/src/lib/db/schema';
import { resolveUrl } from '@/src/lib/utils/url';

/**
 * Get the embed URL for an arcade game
 * In development: uses the local app URL
 * In production: uses the ARCADE_EMBED_DOMAIN for iframe isolation
 */
export function getArcadeEmbedUrl(gameId: string): string {
  if (isDevelopmentEnvironment) {
    return resolveUrl(`/25/arcade/games/${gameId}/embed`);
  }

  const embedDomain = process.env.NEXT_PUBLIC_ARCADE_EMBED_DOMAIN;
  if (!embedDomain) {
    throw new Error(
      'NEXT_PUBLIC_ARCADE_EMBED_DOMAIN environment variable is required in production',
    );
  }

  return `https://${embedDomain}/25/arcade/games/${gameId}/embed`;
}

export function getArcade26EmbedUrl(
  gameSlug: string,
  versionSlug?: string | null,
): string {
  const searchParams = new URLSearchParams();
  if (versionSlug) {
    searchParams.set('version', versionSlug);
  }

  if (isDevelopmentEnvironment) {
    const search = searchParams.toString();
    return resolveUrl(
      `/26/arcade/${gameSlug}/embed${search ? `?${search}` : ''}`,
    );
  }

  const search = searchParams.toString();

  const embedDomain = process.env.NEXT_PUBLIC_ARCADE_EMBED_DOMAIN;
  if (!embedDomain) {
    throw new Error(
      'NEXT_PUBLIC_ARCADE_EMBED_DOMAIN environment variable is required in production',
    );
  }

  return `https://${embedDomain}/26/arcade/${gameSlug}/embed${search ? `?${search}` : ''}`;
}

export function getArcadeVotingWindowState(
  challenge: Pick<ArcadeChallenge, 'submissionDeadline' | 'votingDeadline'>,
  now: Date = new Date(),
) {
  const votingEnded = now > challenge.votingDeadline;

  return {
    votingStarted: true,
    votingEnded,
    isOpen: !votingEnded,
  };
}

export function getArcadeSubmissionWindowState(
  challenge: Pick<ArcadeChallenge, 'submissionDeadline' | 'votingDeadline'>,
  now: Date = new Date(),
) {
  const submissionClosed = now > challenge.submissionDeadline;
  const votingState = getArcadeVotingWindowState(challenge, now);

  return {
    submissionClosed,
    submissionOpen: !submissionClosed,
    votingStarted: votingState.votingStarted,
    votingEnded: votingState.votingEnded,
    votingOpen: votingState.isOpen,
  };
}
