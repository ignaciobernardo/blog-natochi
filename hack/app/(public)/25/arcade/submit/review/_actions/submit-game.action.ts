'use server';

import { resolveUrl } from '@/src/lib/utils/url';
import { arcadeGameNotifier } from '@/src/operators/slack/arcade-game-notifier';
import { getArcadeGameFlatById } from '@/src/queries/arcade-games';

interface SubmitGameResult {
  success: boolean;
  message: string;
}

function getReviewUrl(gameId: string): string {
  return resolveUrl(`/25/arcade/submit/review/${gameId}`);
}

export async function submitGameAction(
  gameId: string,
): Promise<SubmitGameResult> {
  try {
    const game = await getArcadeGameFlatById(gameId);

    if (!game) {
      return {
        success: false,
        message: 'Game not found',
      };
    }

    // Validate game has proper title (not fallback pattern)
    if (!game.title || game.title.trim() === '') {
      return {
        success: false,
        message:
          'Game title is required. Please update your metadata.json with a valid game_name.',
      };
    }

    // Check for fallback title pattern (e.g., "username's game")
    if (game.title.toLowerCase().endsWith("'s game")) {
      return {
        success: false,
        message:
          'Please set a proper game name in your metadata.json (not the default fallback name).',
      };
    }

    // Validate game has cover image
    if (!game.coverUrl) {
      return {
        success: false,
        message:
          'Cover image is required. Please add an 800x600 PNG cover.png to your repository root.',
      };
    }

    // Validate game has description
    if (!game.description || game.description.trim() === '') {
      return {
        success: false,
        message:
          'Game description is required. Please update your metadata.json with a description.',
      };
    }

    // Send Slack notification
    const reviewUrl = getReviewUrl(gameId);
    await arcadeGameNotifier.notifyGameSubmission(game, reviewUrl);

    return {
      success: true,
      message: 'Game submitted successfully!',
    };
  } catch (error) {
    console.error('Submit game error:', error);
    return {
      success: false,
      message: 'Failed to submit game. Please try again.',
    };
  }
}
