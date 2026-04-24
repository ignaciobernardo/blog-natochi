'use server';

import { revalidatePath } from 'next/cache';
import { onlyAdminFull } from '@/src/lib/auth/server';
import {
  type UpdateArcadeChallengeFormData,
  updateArcadeChallengeSchema,
} from '@/src/lib/schemas/arcade-challenge.schema';
import {
  type FormActionState,
  handleCommonError,
  isCommonError,
} from '@/src/lib/utils/forms';
import { dateTimeLocalToChileDate } from '@/src/lib/utils/timezone';
import {
  getArcadeChallengeById,
  updateArcadeChallenge,
} from '@/src/queries/arcade-games';
import { getEventById } from '@/src/queries/events';

export async function updateArcadeChallengeAction(
  data: UpdateArcadeChallengeFormData,
): Promise<FormActionState<UpdateArcadeChallengeFormData>> {
  try {
    await onlyAdminFull();

    const validatedData = updateArcadeChallengeSchema.parse(data);
    const [existingChallenge, event] = await Promise.all([
      getArcadeChallengeById(validatedData.id),
      getEventById(validatedData.eventId),
    ]);

    if (!existingChallenge) {
      return {
        success: false,
        globalError: 'Arcade challenge not found',
      };
    }

    if (!event) {
      return {
        success: false,
        globalError: 'Event not found',
      };
    }

    await updateArcadeChallenge(validatedData.id, {
      eventId: validatedData.eventId,
      name: validatedData.name,
      slug: validatedData.slug,
      submissionDeadline:
        dateTimeLocalToChileDate(validatedData.submissionDeadline) ??
        new Date(),
      votingDeadline:
        dateTimeLocalToChileDate(validatedData.votingDeadline) ?? new Date(),
    });

    revalidatePath('/admin/arcade-challenges');

    return {
      success: true,
      data: validatedData,
      message: 'Arcade challenge updated successfully!',
    };
  } catch (error) {
    if (isCommonError(error)) {
      return handleCommonError<UpdateArcadeChallengeFormData>(error);
    }

    console.error('Update arcade challenge error:', error);
    return {
      success: false,
      globalError:
        error instanceof Error
          ? error.message
          : 'Failed to update arcade challenge. Please try again.',
    };
  }
}
