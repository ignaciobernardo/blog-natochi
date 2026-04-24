'use server';

import {
  type FeedbackFormData,
  feedbackFormSchema,
} from '@/src/lib/schemas/feedback.schema';
import { feedbackNotifier } from '@/src/operators/slack/feedback-notifier';
import {
  createHackerFeedback,
  getHackerFeedbackNotificationData,
  hasSubmittedFeedback,
} from '@/src/queries/hackers';

interface SubmitFeedbackInput {
  hackerProfileId: string;
  eventId: string;
  formData: FeedbackFormData;
}

interface SubmitFeedbackResult {
  success: boolean;
  error?: string;
}

export async function submitFeedbackAction(
  input: SubmitFeedbackInput,
): Promise<SubmitFeedbackResult> {
  try {
    const { hackerProfileId, eventId, formData } = input;

    // Validate the form data
    const validationResult = feedbackFormSchema.safeParse(formData);
    if (!validationResult.success) {
      return {
        success: false,
        error: 'Datos del formulario inválidos',
      };
    }

    // Check if feedback already exists
    const alreadySubmitted = await hasSubmittedFeedback(
      hackerProfileId,
      eventId,
    );
    if (alreadySubmitted) {
      return {
        success: false,
        error: 'Ya enviaste tu feedback para este evento',
      };
    }

    // Create the feedback record
    await createHackerFeedback({
      hackerProfileId,
      eventId,
      overallRating: validationResult.data.overallRating,
      npsScore: validationResult.data.npsScore,
      participationIntent: validationResult.data.participationIntent,
      eventQualityRatings: validationResult.data.eventQualityRatings,
      bestPart: validationResult.data.bestPart,
      worstPart: validationResult.data.worstPart || null,
      suggestions: validationResult.data.suggestions || null,
      sponsorUnaidedRecall: validationResult.data.sponsorUnaidedRecall,
      sponsorsInteracted: validationResult.data.sponsorsInteracted || null,
      sponsorWorkIntent: validationResult.data.sponsorWorkIntent || null,
      sponsorComments: validationResult.data.sponsorComments || null,
      startupIntent: validationResult.data.startupIntent,
      fundingPreference: validationResult.data.fundingPreference || null,
      startupAmbition: validationResult.data.startupAmbition || null,
      howHeardAbout: validationResult.data.howHeardAbout || null,
      additionalComments: validationResult.data.additionalComments || null,
      mediaUrls: validationResult.data.mediaUrls || null,
      feedbackUsagePermission: validationResult.data.feedbackUsagePermission,
      mentorRating: validationResult.data.mentorRating || null,
    });

    // Send Slack notification (don't block on failure)
    const notificationData = await getHackerFeedbackNotificationData(
      hackerProfileId,
      eventId,
    );
    if (notificationData) {
      feedbackNotifier
        .notifyNewFeedback({
          ...notificationData,
          feedback: validationResult.data,
        })
        .catch((err) =>
          console.error('Failed to send feedback notification:', err),
        );
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return {
      success: false,
      error: 'Error al enviar el feedback. Por favor intenta de nuevo.',
    };
  }
}
