'use server';

import { revalidatePath } from 'next/cache';
import { revalidateAdminEventPathByEventId } from '@/src/lib/admin/revalidate';
import { onlyAdminFull } from '@/src/lib/auth/server';
import {
  type TimeSlotFormData,
  timeSlotFormSchema,
} from '@/src/lib/schemas/time-slots.schema';
import {
  type FormActionState,
  handleCommonError,
  isCommonError,
} from '@/src/lib/utils/forms';
import { updateTimeSlot } from '@/src/queries/time-slots';

export async function updateTimeSlotAction(
  id: string,
  data: TimeSlotFormData,
): Promise<FormActionState<TimeSlotFormData>> {
  try {
    await onlyAdminFull();

    const validatedData = timeSlotFormSchema.parse(data);

    await updateTimeSlot(id, validatedData);

    await revalidateAdminEventPathByEventId(
      validatedData.eventId,
      'time-slots',
    );
    revalidatePath('/schedule');

    return {
      success: true,
      data: validatedData,
      message: 'Time slot updated successfully!',
    };
  } catch (error) {
    if (isCommonError(error)) {
      return handleCommonError<TimeSlotFormData>(error);
    }

    console.error('Update time slot error:', error);
    return {
      success: false,
      globalError:
        error instanceof Error
          ? error.message
          : 'Failed to update time slot. Please try again.',
    };
  }
}
