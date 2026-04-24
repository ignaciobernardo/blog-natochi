'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/src/lib/auth/server';
import { db } from '@/src/lib/db';
import { publicVotes } from '@/src/lib/db/schema';
import { voteNotifier } from '@/src/operators/slack/vote-notifier';
import { getDefaultEvent } from '@/src/queries/events';
import { hasGoogleAccount } from '@/src/queries/users';
import { getUserVoteCount } from '@/src/queries/votes';

const MAX_VOTES_PER_USER =
  Number.parseInt(process.env.MAX_VOTES_PER_USER || '0', 10) || 0;

export async function voteForProjectAction(
  projectId: string,
  projectSlug?: string,
) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return {
        success: false,
        error: 'Debes iniciar sesión con una cuenta de Google para votar',
        requiresAuth: true,
      };
    }

    // Check if user has a Google account linked
    if (!(await hasGoogleAccount(session.user.id))) {
      return {
        success: false,
        error:
          'Solo las cuentas de Google pueden votar. Por favor inicia sesión con Google.',
        requiresAuth: true,
      };
    }

    // Check email domain blacklist
    const emailDomain = session.user.email.split('@')[1]?.toLowerCase();
    const blacklistedDomains = (process.env.VOTING_EMAIL_BLACKLIST || '')
      .split(',')
      .map((domain) => domain.trim().toLowerCase())
      .filter(Boolean);

    if (emailDomain && blacklistedDomains.includes(emailDomain)) {
      return {
        success: false,
        error: 'Tu dominio de correo no está permitido para votar.',
        requiresAuth: true,
      };
    }

    // Check voting period
    const event = await getDefaultEvent();
    const now = new Date();

    if (event?.votingStartsAt && now < event.votingStartsAt) {
      return {
        success: false,
        error: 'La votación aún no ha comenzado',
        isPeriodError: true,
      };
    }

    if (event?.votingEndsAt && now > event.votingEndsAt) {
      return {
        success: false,
        error: 'El período de votación ha finalizado',
        isPeriodError: true,
      };
    }

    // Check if user already voted
    const existingVote = await db
      .select()
      .from(publicVotes)
      .where(
        and(
          eq(publicVotes.userId, session.user.id),
          eq(publicVotes.projectId, projectId),
        ),
      )
      .limit(1);

    if (existingVote.length > 0) {
      // Remove vote (toggle)
      await db
        .delete(publicVotes)
        .where(eq(publicVotes.id, existingVote[0].id));

      // Send Slack notification
      await voteNotifier.notifyVote({
        userEmail: session.user.email,
        projectId,
        projectSlug,
        voteAction: 'removed',
      });

      revalidatePath('/25/vote');
      if (projectSlug) {
        revalidatePath(`/25/vote/${projectSlug}`);
      }
      return { success: true, action: 'removed' as const };
    }

    // Check vote limit before adding
    if (MAX_VOTES_PER_USER > 0) {
      const currentVotes = await getUserVoteCount(session.user.id);

      if (currentVotes >= MAX_VOTES_PER_USER) {
        return {
          success: false,
          error: `Has alcanzado el límite de ${MAX_VOTES_PER_USER} votos.`,
          isLimitError: true,
        };
      }
    }

    // Add vote
    await db.insert(publicVotes).values({
      userId: session.user.id,
      projectId,
    });

    // Send Slack notification
    await voteNotifier.notifyVote({
      userEmail: session.user.email,
      projectId,
      projectSlug,
      voteAction: 'added',
    });

    revalidatePath('/25/vote');
    if (projectSlug) {
      revalidatePath(`/25/vote/${projectSlug}`);
    }
    return { success: true, action: 'added' as const };
  } catch (error) {
    console.error('Vote error:', error);
    return {
      success: false,
      error: 'Error al registrar el voto. Por favor intenta de nuevo.',
    };
  }
}
