'use server';

import { revalidatePath } from 'next/cache';
import { revalidateAdminEventPathByEventId } from '@/src/lib/admin/revalidate';
import { onlyAdminFull } from '@/src/lib/auth/server';
import { deleteTimeSlot, getTimeSlotById } from '@/src/queries/time-slots';

export async function deleteTimeSlotAction(id: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    await onlyAdminFull();
    const timeSlot = await getTimeSlotById(id);

    if (!timeSlot) {
      return {
        success: false,
        error: 'Time slot not found',
      };
    }

    await deleteTimeSlot(id);

    await revalidateAdminEventPathByEventId(timeSlot.eventId, 'time-slots');
    revalidatePath('/schedule');

    return {
      success: true,
      message: 'Time slot deleted successfully!',
    };
  } catch (error) {
    console.error('Delete time slot error:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to delete time slot. Please try again.',
    };
  }
}
