'use server';

import { revalidatePath } from 'next/cache';
import { onlyAdminFull } from '@/src/lib/auth/server';
import {
  type CreateEventFormData,
  createEventSchema,
} from '@/src/lib/schemas/event.schema';
import {
  type FormActionState,
  handleCommonError,
  isCommonError,
} from '@/src/lib/utils/forms';
import { dateTimeLocalToChileDate } from '@/src/lib/utils/timezone';
import { createEvent } from '@/src/queries/events';

export async function createEventAction(
  data: CreateEventFormData,
): Promise<FormActionState<CreateEventFormData>> {
  try {
    await onlyAdminFull();

    const validatedData = createEventSchema.parse(data);

    const _newEvent = await createEvent({
      name: validatedData.name,
      slug: validatedData.slug,
      domain: validatedData.domain,
      photosAlbumUrl: validatedData.photosAlbumUrl ?? null,
      priorityAnswerDate: dateTimeLocalToChileDate(
        validatedData.priorityAnswerDate,
      ),
      priorityDeadlineAt: dateTimeLocalToChileDate(
        validatedData.priorityDeadlineAt,
      ),
      finalDeadlineAt: dateTimeLocalToChileDate(validatedData.finalDeadlineAt),
      startsAt: dateTimeLocalToChileDate(validatedData.startsAt),
      endsAt: dateTimeLocalToChileDate(validatedData.endsAt),
      rsvpOpenAt: dateTimeLocalToChileDate(validatedData.rsvpOpenAt),
      votingStartsAt: dateTimeLocalToChileDate(validatedData.votingStartsAt),
      votingEndsAt: dateTimeLocalToChileDate(validatedData.votingEndsAt),
      trackSelectionStartTime: dateTimeLocalToChileDate(
        validatedData.trackSelectionStartTime,
      ),
      mentorSelectionStartTime: dateTimeLocalToChileDate(
        validatedData.mentorSelectionStartTime,
      ),
      feedbackPrizeDeadline: dateTimeLocalToChileDate(
        validatedData.feedbackPrizeDeadline,
      ),
      capacityTeams: validatedData.capacityTeams ?? null,
      capacityHackers: validatedData.capacityHackers ?? null,
      targetSubmission: validatedData.targetSubmission ?? null,
      trackTeamLimit: validatedData.trackTeamLimit ?? null,
      mentorTeamLimit: validatedData.mentorTeamLimit ?? null,
    });

    revalidatePath('/admin/events');

    return {
      success: true,
      data: validatedData,
      message: 'Event created successfully!',
    };
  } catch (error) {
    if (isCommonError(error)) {
      return handleCommonError<CreateEventFormData>(error);
    }

    console.error('Create event error:', error);
    return {
      success: false,
      globalError:
        error instanceof Error
          ? error.message
          : 'Failed to create event. Please try again.',
    };
  }
}
