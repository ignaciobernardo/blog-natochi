'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/src/lib/auth/server';
import {
  getArcadeGameVoteSummary,
  hasUserVotedForArcadeGame,
  removeArcadeGameVote,
  resolveArcadeGameForVoting,
  voteForArcadeGame,
} from '@/src/queries/arcade-games';
import { hasGoogleAccount } from '@/src/queries/users';

type ToggleArcadeVoteResult =
  | {
      success: true;
      hasVoted: boolean;
      voteCount: number;
    }
  | {
      success: false;
      error: string;
      requiresAuth?: boolean;
      isPeriodError?: boolean;
    };

export async function toggleArcadeGameVoteAction(
  gameId: string,
): Promise<ToggleArcadeVoteResult> {
  try {
    const session = await getSession();

    if (!session?.user) {
      return {
        success: false,
        error: 'Debes iniciar sesión con una cuenta de Google para votar',
        requiresAuth: true,
      };
    }

    if (!(await hasGoogleAccount(session.user.id))) {
      return {
        success: false,
        error:
          'Solo las cuentas de Google pueden votar. Por favor inicia sesión con Google.',
        requiresAuth: true,
      };
    }

    const resolution = await resolveArcadeGameForVoting(gameId);

    if ('error' in resolution) {
      return {
        success: false,
        error: 'No se pudo resolver el juego para votar.',
      };
    }

    if (!resolution.votingState.isOpen) {
      return {
        success: false,
        error: resolution.votingState.votingStarted
          ? 'El período de votación ha finalizado'
          : 'La votación aún no ha comenzado',
        isPeriodError: true,
      };
    }

    const alreadyVoted = await hasUserVotedForArcadeGame(
      session.user.id,
      gameId,
    );

    if (alreadyVoted) {
      await removeArcadeGameVote(session.user.id, gameId);
    } else {
      await voteForArcadeGame(session.user.id, gameId);
    }

    const summary = await getArcadeGameVoteSummary(gameId, session.user.id);

    revalidatePath('/26/arcade');
    revalidatePath(`/26/arcade/${resolution.latestVersion.slug}`);
    revalidatePath('/admin/26/arcade');

    return {
      success: true,
      hasVoted: summary.hasVoted,
      voteCount: summary.voteCount,
    };
  } catch (error) {
    console.error('Arcade vote error:', error);
    return {
      success: false,
      error: 'Error al registrar el voto. Por favor intenta de nuevo.',
    };
  }
}
