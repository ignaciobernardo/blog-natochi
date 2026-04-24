'use server';

import {
  type CheckResults,
  createArcadeGameDraft,
} from '@/src/operators/arcade-game-submission';
import { getArcadeEvent } from '../../_utils/get-arcade-event';

interface ValidationResult {
  success: boolean;
  message?: string;
  gameName?: string;
  gameId?: string;
  restrictions?: CheckResults;
  redirectTo?: string;
}

export async function validateGameSubmission(
  repoUrl: string,
): Promise<ValidationResult> {
  const currentEvent = await getArcadeEvent();

  if (!currentEvent) {
    return {
      success: false,
      message: 'No active event found',
    };
  }

  const result = await createArcadeGameDraft(repoUrl, currentEvent.id);

  // If game already exists, redirect to review page immediately (mark as success to skip error display)
  if (
    !result.success &&
    result.gameId &&
    result.message?.includes('already exists')
  ) {
    return {
      success: true, // Mark as success to avoid showing error message
      message:
        'Redirecting to your existing submission. You can update it anytime using the refresh button.',
      gameId: result.gameId,
      restrictions: result.restrictions,
      redirectTo: `/25/arcade/submit/review/${result.gameId}`,
    };
  }

  return {
    success: result.success,
    message: result.message,
    gameId: result.gameId,
    restrictions: result.restrictions,
    redirectTo:
      result.success && result.gameId
        ? `/25/arcade/submit/review/${result.gameId}`
        : undefined,
  };
}
