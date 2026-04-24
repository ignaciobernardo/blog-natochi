'use server';

import { revalidateAdminEventPath } from '@/src/lib/admin/revalidate';
import { onlyAdminFull } from '@/src/lib/auth/server';
import {
  type MentorFormData,
  mentorFormSchema,
} from '@/src/lib/schemas/mentor.schema';
import {
  type FormActionState,
  handleCommonError,
  isCommonError,
} from '@/src/lib/utils/forms';
import { getEventBySlug } from '@/src/queries/events';
import {
  createMentor,
  deleteMentor,
  updateMentor,
} from '@/src/queries/mentors';

export async function createMentorAction(
  data: MentorFormData,
  eventSlug: string,
): Promise<FormActionState<MentorFormData>> {
  try {
    await onlyAdminFull();

    const validatedData = mentorFormSchema.parse(data);
    const event = await getEventBySlug(eventSlug);

    if (!event) {
      return {
        success: false,
        globalError: 'Event not found',
      };
    }

    await createMentor({
      eventId: event.id,
      fullName: validatedData.fullName,
      github: validatedData.github,
      linkedin: validatedData.linkedin || null,
      pictureUrl: validatedData.pictureUrl || null,
      companyTitle: validatedData.companyTitle || null,
    });

    revalidateAdminEventPath(eventSlug, 'mentors');

    return {
      success: true,
      data: validatedData,
      message: 'Mentor created successfully',
    };
  } catch (error) {
    if (isCommonError(error)) {
      return handleCommonError<MentorFormData>(error);
    }
    console.error('Create mentor error:', error);
    return {
      success: false,
      globalError:
        error instanceof Error ? error.message : 'Failed to create mentor',
    };
  }
}

export async function updateMentorAction(
  id: string,
  data: MentorFormData,
  eventSlug: string,
): Promise<FormActionState<MentorFormData>> {
  try {
    await onlyAdminFull();

    const validatedData = mentorFormSchema.parse(data);
    const event = await getEventBySlug(eventSlug);

    if (!event) {
      return {
        success: false,
        globalError: 'Event not found',
      };
    }

    const mentor = await updateMentor(id, event.id, {
      fullName: validatedData.fullName,
      github: validatedData.github,
      linkedin: validatedData.linkedin || null,
      pictureUrl: validatedData.pictureUrl || null,
      companyTitle: validatedData.companyTitle || null,
    });

    if (!mentor) {
      return {
        success: false,
        globalError: 'Mentor not found',
      };
    }

    revalidateAdminEventPath(eventSlug, 'mentors');

    return {
      success: true,
      data: validatedData,
      message: 'Mentor updated successfully',
    };
  } catch (error) {
    if (isCommonError(error)) {
      return handleCommonError<MentorFormData>(error);
    }
    console.error('Update mentor error:', error);
    return {
      success: false,
      globalError:
        error instanceof Error ? error.message : 'Failed to update mentor',
    };
  }
}

export async function deleteMentorAction(
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

    await deleteMentor(id, event.id);

    revalidateAdminEventPath(eventSlug, 'mentors');

    return { success: true };
  } catch (error) {
    console.error('Delete mentor error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete mentor',
    };
  }
}
