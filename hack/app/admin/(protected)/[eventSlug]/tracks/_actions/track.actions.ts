'use server';

import { revalidateAdminEventPath } from '@/src/lib/admin/revalidate';
import { onlyAdminFull } from '@/src/lib/auth/server';
import {
  type TrackFormData,
  trackFormSchema,
} from '@/src/lib/schemas/tracks.schema';
import {
  type FormActionState,
  handleCommonError,
  isCommonError,
} from '@/src/lib/utils/forms';
import { getEventBySlug } from '@/src/queries/events';
import { createTrack, deleteTrack, updateTrack } from '@/src/queries/tracks';

export async function createTrackAction(
  data: TrackFormData,
  eventSlug: string,
): Promise<FormActionState<TrackFormData>> {
  try {
    await onlyAdminFull();

    const validatedData = trackFormSchema.parse(data);
    const event = await getEventBySlug(eventSlug);

    if (!event) {
      return {
        success: false,
        globalError: 'Event not found',
      };
    }

    await createTrack({
      eventId: event.id,
      name: validatedData.name,
      description: validatedData.description || null,
    });

    revalidateAdminEventPath(eventSlug, 'tracks');

    return {
      success: true,
      data: validatedData,
      message: 'Track created successfully',
    };
  } catch (error) {
    if (isCommonError(error)) {
      return handleCommonError<TrackFormData>(error);
    }
    console.error('Create track error:', error);
    return {
      success: false,
      globalError:
        error instanceof Error ? error.message : 'Failed to create track',
    };
  }
}

export async function updateTrackAction(
  id: string,
  data: TrackFormData,
  eventSlug: string,
): Promise<FormActionState<TrackFormData>> {
  try {
    await onlyAdminFull();

    const validatedData = trackFormSchema.parse(data);
    const event = await getEventBySlug(eventSlug);

    if (!event) {
      return {
        success: false,
        globalError: 'Event not found',
      };
    }

    const track = await updateTrack(id, event.id, {
      name: validatedData.name,
      description: validatedData.description || null,
    });

    if (!track) {
      return {
        success: false,
        globalError: 'Track not found',
      };
    }

    revalidateAdminEventPath(eventSlug, 'tracks');
    revalidateAdminEventPath(eventSlug, 'tracks', id);

    return {
      success: true,
      data: validatedData,
      message: 'Track updated successfully',
    };
  } catch (error) {
    if (isCommonError(error)) {
      return handleCommonError<TrackFormData>(error);
    }
    console.error('Update track error:', error);
    return {
      success: false,
      globalError:
        error instanceof Error ? error.message : 'Failed to update track',
    };
  }
}

export async function deleteTrackAction(
  id: string,
  eventSlug: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await onlyAdminFull();
    const event = await getEventBySlug(eventSlug);

    if (!event) {
      return {
        success: false,
        error: 'Event not found',
      };
    }

    await deleteTrack(id, event.id);

    revalidateAdminEventPath(eventSlug, 'tracks');

    return { success: true };
  } catch (error) {
    console.error('Delete track error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete track',
    };
  }
}
