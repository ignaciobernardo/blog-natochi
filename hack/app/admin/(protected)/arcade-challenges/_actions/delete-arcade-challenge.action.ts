'use server';

import { revalidatePath } from 'next/cache';
import { onlyAdminFull } from '@/src/lib/auth/server';
import {
  deleteArcadeChallenge,
  getArcadeChallengeById,
} from '@/src/queries/arcade-games';

export async function deleteArcadeChallengeAction(
  challengeId: string,
): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    await onlyAdminFull();

    const existingChallenge = await getArcadeChallengeById(challengeId);

    if (!existingChallenge) {
      return {
        success: false,
        error: 'Arcade challenge not found',
      };
    }

    await deleteArcadeChallenge(challengeId);

    revalidatePath('/admin/arcade-challenges');

    return {
      success: true,
      message: 'Arcade challenge deleted successfully',
    };
  } catch (error) {
    console.error('Delete arcade challenge error:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to delete arcade challenge. Please try again.',
    };
  }
}
