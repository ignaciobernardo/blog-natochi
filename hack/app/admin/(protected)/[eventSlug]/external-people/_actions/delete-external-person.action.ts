'use server';

import { revalidateAdminEventPath } from '@/src/lib/admin/revalidate';
import { onlyAdminFull } from '@/src/lib/auth/server';
import {
  deleteExternalPerson,
  getExternalPersonById,
} from '@/src/queries/external-people';

export async function deleteExternalPersonAction(
  id: string,
  eventId: string,
  eventSlug: string,
): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    await onlyAdminFull();

    const existing = await getExternalPersonById(id, eventId);
    if (!existing) {
      return {
        success: false,
        error: 'External person not found',
      };
    }

    await deleteExternalPerson(id);

    revalidateAdminEventPath(eventSlug, 'external-people');

    return {
      success: true,
      message: 'External person deleted successfully',
    };
  } catch (error) {
    console.error('Delete external person error:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to delete external person. Please try again.',
    };
  }
}
