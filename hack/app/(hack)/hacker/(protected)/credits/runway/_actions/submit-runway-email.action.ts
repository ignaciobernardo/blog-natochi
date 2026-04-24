'use server';

import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { onlyAuthenticated } from '@/src/lib/auth/server';
import { db } from '@/src/lib/db';
import { hackerProfiles } from '@/src/lib/db/schema';
import {
  type RunwayEmailFormData,
  runwayEmailFormSchema,
} from '@/src/lib/schemas/runway-email.schema';
import {
  type FormActionState,
  handleCommonError,
  isCommonError,
} from '@/src/lib/utils/forms';
import { runwayRequestNotifier } from '@/src/operators/slack/runway-request-notifier';
import { getHackerById } from '@/src/queries/hackers';

export async function submitRunwayEmailAction(
  data: RunwayEmailFormData,
): Promise<FormActionState<RunwayEmailFormData>> {
  try {
    const session = await onlyAuthenticated();

    if (!session.user.linkedId) {
      redirect('/login?error=no_hacker_linked');
    }

    const validatedData = runwayEmailFormSchema.parse(data);

    const hackerProfile = await db.query.hackerProfiles.findFirst({
      where: eq(hackerProfiles.hackerId, session.user.linkedId),
      orderBy: (hackerProfiles, { desc }) => [desc(hackerProfiles.createdAt)],
    });

    if (!hackerProfile) {
      return {
        success: false,
        globalError: 'Perfil de hacker no encontrado',
      };
    }

    await db
      .update(hackerProfiles)
      .set({
        runwayEmail: validatedData.runwayEmail,
        runwayRequestSentAt: new Date(),
      })
      .where(eq(hackerProfiles.id, hackerProfile.id));

    const hacker = await getHackerById(session.user.linkedId);

    await runwayRequestNotifier.notifyNewRequest({
      hackerGithub: hacker?.github || null,
      runwayEmail: validatedData.runwayEmail,
    });

    return {
      success: true,
      data: validatedData,
      message: 'Email enviado exitosamente',
    };
  } catch (error) {
    if (isCommonError(error)) {
      return handleCommonError<RunwayEmailFormData>(error);
    }

    console.error('Submit Runway email error:', error);
    return {
      success: false,
      globalError:
        error instanceof Error
          ? error.message
          : 'Error al enviar el email. Por favor intenta de nuevo.',
    };
  }
}
