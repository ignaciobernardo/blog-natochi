'use server';

import { revalidateAdminEventPathByEventId } from '@/src/lib/admin/revalidate';
import { onlyAdmin } from '@/src/lib/auth/server';
import {
  getArcadeChallengeById,
  getArcadeGameById,
  getArcadeGameVersionById,
  updateArcadeGameVersionMapping,
} from '@/src/queries/arcade-games';

interface UpdateMappingResult {
  success: boolean;
  message: string;
}

export async function updateMappingAction(
  versionId: string,
  mapping: Record<string, string>,
): Promise<UpdateMappingResult> {
  try {
    await onlyAdmin();

    const version = await getArcadeGameVersionById(versionId);
    if (!version) {
      return {
        success: false,
        message: 'Game version not found',
      };
    }

    const game = await getArcadeGameById(version.gameId);
    if (!game) {
      return {
        success: false,
        message: 'Game not found',
      };
    }

    const challenge = await getArcadeChallengeById(game.challengeId);
    if (!challenge) {
      return {
        success: false,
        message: 'Arcade challenge not found',
      };
    }

    const updated = await updateArcadeGameVersionMapping(versionId, mapping);
    if (!updated) {
      return {
        success: false,
        message: 'Failed to update mapping',
      };
    }

    await revalidateAdminEventPathByEventId(
      challenge.eventId,
      'arcade',
      game.id,
    );
    await revalidateAdminEventPathByEventId(challenge.eventId, 'arcade');

    return {
      success: true,
      message: 'Arcade mapping updated successfully',
    };
  } catch (error) {
    console.error('Update mapping error:', error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : 'Failed to update mapping',
    };
  }
}
