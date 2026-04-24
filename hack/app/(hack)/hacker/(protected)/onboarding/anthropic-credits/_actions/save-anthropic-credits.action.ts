'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { onlyAuthenticated } from '@/src/lib/auth/server';
import { db } from '@/src/lib/db';
import { hackerProfiles, submissions } from '@/src/lib/db/schema';
import {
  type AnthropicCreditsFormData,
  anthropicCreditsFormSchema,
} from '@/src/lib/schemas/anthropic-credits.schema';
import {
  type FormActionState,
  handleCommonError,
  isCommonError,
} from '@/src/lib/utils/forms';

export async function saveAnthropicCreditsAction(
  data: AnthropicCreditsFormData,
): Promise<FormActionState<AnthropicCreditsFormData>> {
  try {
    const session = await onlyAuthenticated();

    if (!session.user.linkedId) {
      return {
        success: false,
        globalError: 'No hacker account linked',
      };
    }

    const validatedData = anthropicCreditsFormSchema.parse(data);

    // Get the profile for the submission with onboarding_request status
    const [result] = await db
      .select({
        profileId: hackerProfiles.id,
      })
      .from(hackerProfiles)
      .innerJoin(submissions, eq(hackerProfiles.submissionId, submissions.id))
      .where(
        and(
          eq(hackerProfiles.hackerId, session.user.linkedId),
          eq(submissions.status, 'onboarding_request'),
        ),
      )
      .limit(1);

    if (!result) {
      return {
        success: false,
        globalError: 'No hacker profile found for onboarding',
      };
    }

    await db
      .update(hackerProfiles)
      .set({
        anthropicOrgId: validatedData.anthropicOrgId || null,
        anthropicUsedProducts: validatedData.anthropicUsedProducts || null,
        anthropicAccountEmail: validatedData.anthropicAccountEmail,
        anthropicUpdates: validatedData.anthropicUpdates,
      })
      .where(eq(hackerProfiles.id, result.profileId));

    revalidatePath('/hacker/onboarding');

    return {
      success: true,
      data: validatedData,
      message: 'Información guardada exitosamente',
      redirectTo: '/hacker/onboarding',
    };
  } catch (error) {
    if (isCommonError(error)) {
      return handleCommonError<AnthropicCreditsFormData>(error);
    }

    console.error('Save Anthropic credits error:', error);
    return {
      success: false,
      globalError:
        error instanceof Error
          ? error.message
          : 'Error al guardar la información',
    };
  }
}
