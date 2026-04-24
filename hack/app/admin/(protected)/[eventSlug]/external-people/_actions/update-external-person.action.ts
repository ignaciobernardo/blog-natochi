'use server';

import { revalidateAdminEventPath } from '@/src/lib/admin/revalidate';
import { onlyAdminFull } from '@/src/lib/auth/server';
import {
  type UpdateExternalPersonFormData,
  updateExternalPersonSchema,
} from '@/src/lib/schemas/external-people.schema';
import {
  type FormActionState,
  handleCommonError,
  isCommonError,
} from '@/src/lib/utils/forms';
import {
  getExternalPersonById,
  getExternalPersonBySlug,
  updateExternalPerson,
} from '@/src/queries/external-people';

export async function updateExternalPersonAction(
  data: UpdateExternalPersonFormData,
  eventId: string,
  eventSlug: string,
): Promise<FormActionState<UpdateExternalPersonFormData>> {
  try {
    await onlyAdminFull();

    const validatedData = updateExternalPersonSchema.parse(data);

    const existing = await getExternalPersonById(validatedData.id, eventId);
    if (!existing) {
      return {
        success: false,
        globalError: 'External person not found',
      };
    }

    if (validatedData.slug !== existing.slug) {
      const slugExists = await getExternalPersonBySlug(
        eventId,
        validatedData.slug,
      );
      if (slugExists) {
        return {
          success: false,
          errors: {
            slug: ['A person with this slug already exists'],
          },
        };
      }
    }

    await updateExternalPerson(validatedData.id, {
      slug: validatedData.slug,
      fullName: validatedData.fullName,
      category: validatedData.category,
      role: validatedData.role || null,
      githubUrl: validatedData.githubUrl || null,
      linkedinUrl: validatedData.linkedinUrl || null,
      redirectUrl: validatedData.redirectUrl || null,
    });

    revalidateAdminEventPath(eventSlug, 'external-people');

    return {
      success: true,
      data: validatedData,
      message: 'External person updated successfully!',
    };
  } catch (error) {
    if (isCommonError(error)) {
      return handleCommonError<UpdateExternalPersonFormData>(error);
    }

    console.error('Update external person error:', error);
    return {
      success: false,
      globalError:
        error instanceof Error
          ? error.message
          : 'Failed to update external person. Please try again.',
    };
  }
}
