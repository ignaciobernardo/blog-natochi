'use server';

import { revalidatePath } from 'next/cache';
import { onlyAdminFull } from '@/src/lib/auth/server';
import {
  type CreateArcadeChallengeFormData,
  createArcadeChallengeSchema,
} from '@/src/lib/schemas/arcade-challenge.schema';
import {
  type FormActionState,
  handleCommonError,
  isCommonError,
} from '@/src/lib/utils/forms';
import { dateTimeLocalToChileDate } from '@/src/lib/utils/timezone';
import { createArcadeChallenge } from '@/src/queries/arcade-games';
import { getEventById } from '@/src/queries/events';

export async function createArcadeChallengeAction(
  data: CreateArcadeChallengeFormData,
): Promise<FormActionState<CreateArcadeChallengeFormData>> {
  try {
    await onlyAdminFull();

    const validatedData = createArcadeChallengeSchema.parse(data);
    const event = await getEventById(validatedData.eventId);

    if (!event) {
      return {
        success: false,
        globalError: 'Event not found',
      };
    }

    await createArcadeChallenge({
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
      message: 'Arcade challenge created successfully!',
    };
  } catch (error) {
    if (isCommonError(error)) {
      return handleCommonError<CreateArcadeChallengeFormData>(error);
    }

    console.error('Create arcade challenge error:', error);
    return {
      success: false,
      globalError:
        error instanceof Error
          ? error.message
          : 'Failed to create arcade challenge. Please try again.',
    };
  }
}
