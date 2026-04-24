'use server';

import { revalidateAdminEventPath } from '@/src/lib/admin/revalidate';
import { onlyAdminFull } from '@/src/lib/auth/server';
import {
  type CreateExternalPersonFormData,
  createExternalPersonSchema,
} from '@/src/lib/schemas/external-people.schema';
import {
  type FormActionState,
  handleCommonError,
  isCommonError,
} from '@/src/lib/utils/forms';
import {
  createExternalPerson,
  getExternalPersonBySlug,
} from '@/src/queries/external-people';

export async function createExternalPersonAction(
  data: CreateExternalPersonFormData,
  eventId: string,
  eventSlug: string,
): Promise<FormActionState<CreateExternalPersonFormData>> {
  try {
    await onlyAdminFull();

    const validatedData = createExternalPersonSchema.parse(data);

    const existing = await getExternalPersonBySlug(eventId, validatedData.slug);
    if (existing) {
      return {
        success: false,
        errors: {
          slug: ['A person with this slug already exists'],
        },
      };
    }

    await createExternalPerson({
      eventId,
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
      message: 'External person created successfully!',
    };
  } catch (error) {
    if (isCommonError(error)) {
      return handleCommonError<CreateExternalPersonFormData>(error);
    }

    console.error('Create external person error:', error);
    return {
      success: false,
      globalError:
        error instanceof Error
          ? error.message
          : 'Failed to create external person. Please try again.',
    };
  }
}
