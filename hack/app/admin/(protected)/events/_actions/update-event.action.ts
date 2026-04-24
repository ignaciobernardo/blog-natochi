'use server';

import { revalidatePath } from 'next/cache';
import { onlyAdminFull } from '@/src/lib/auth/server';
import {
  type UpdateEventFormData,
  updateEventSchema,
} from '@/src/lib/schemas/event.schema';
import {
  type FormActionState,
  handleCommonError,
  isCommonError,
} from '@/src/lib/utils/forms';
import { dateTimeLocalToChileDate } from '@/src/lib/utils/timezone';
import { getEventById, updateEvent } from '@/src/queries/events';

export async function updateEventAction(
  data: UpdateEventFormData,
): Promise<FormActionState<UpdateEventFormData>> {
  try {
    await onlyAdminFull();

    const validatedData = updateEventSchema.parse(data);

    const existingEvent = await getEventById(validatedData.id);
    if (!existingEvent) {
      return {
        success: false,
        globalError: 'Event not found',
      };
    }

    await updateEvent(validatedData.id, {
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
      message: 'Event updated successfully!',
    };
  } catch (error) {
    if (isCommonError(error)) {
      return handleCommonError<UpdateEventFormData>(error);
    }

    console.error('Update event error:', error);
    return {
      success: false,
      globalError:
        error instanceof Error
          ? error.message
          : 'Failed to update event. Please try again.',
    };
  }
}
