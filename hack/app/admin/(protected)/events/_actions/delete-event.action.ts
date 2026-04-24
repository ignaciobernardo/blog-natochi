'use server';

import { revalidatePath } from 'next/cache';
import { onlyAdminFull } from '@/src/lib/auth/server';
import { deleteEvent, getEventById } from '@/src/queries/events';

export async function deleteEventAction(eventId: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    await onlyAdminFull();

    const existingEvent = await getEventById(eventId);

    if (!existingEvent) {
      return {
        success: false,
        error: 'Event not found',
      };
    }

    await deleteEvent(eventId);

    revalidatePath('/admin/events');

    return {
      success: true,
      message: 'Event deleted successfully',
    };
  } catch (error) {
    console.error('Delete event error:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to delete event. Please try again.',
    };
  }
}
