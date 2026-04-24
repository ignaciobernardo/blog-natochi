'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { onlyAuthenticated } from '@/src/lib/auth/server';
import { db } from '@/src/lib/db';
import { hackerProfiles, submissions } from '@/src/lib/db/schema';
import { getHackerById } from '@/src/queries/hackers';

export async function acceptTermsAction(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const session = await onlyAuthenticated();

    if (!session.user.linkedId) {
      return {
        success: false,
        error: 'No hacker linked to user',
      };
    }

    const hacker = await getHackerById(session.user.linkedId);

    if (!hacker) {
      return {
        success: false,
        error: 'Hacker not found',
      };
    }

    // Get the profile for the submission with onboarding_request status
    const [result] = await db
      .select({
        profileId: hackerProfiles.id,
      })
      .from(hackerProfiles)
      .innerJoin(submissions, eq(hackerProfiles.submissionId, submissions.id))
      .where(
        and(
          eq(hackerProfiles.hackerId, hacker.id),
          eq(submissions.status, 'onboarding_request'),
        ),
      )
      .limit(1);

    if (!result) {
      return {
        success: false,
        error: 'Hacker profile not found for onboarding',
      };
    }

    const updateResult = await db
      .update(hackerProfiles)
      .set({
        termsAcceptedAt: new Date(),
      })
      .where(eq(hackerProfiles.id, result.profileId))
      .returning();

    console.log('Terms acceptance update result:', updateResult);
    console.log('Updated termsAcceptedAt:', updateResult[0]?.termsAcceptedAt);

    revalidatePath('/hacker/onboarding');

    return {
      success: true,
    };
  } catch (error) {
    console.error('Error accepting terms:', error);
    return {
      success: false,
      error: 'Error al aceptar las bases',
    };
  }
}
