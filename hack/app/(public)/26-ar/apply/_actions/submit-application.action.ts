'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/src/lib/db';
import {
  type Cohort,
  type Event,
  type Gender,
  hackerProfiles,
  hackers,
  submissions,
} from '@/src/lib/db/schema';
import { applicationSchema } from '@/src/lib/schemas/application.schema';
import type { ApplicationFormData } from '@/src/lib/types/application';
import { normalizeCountry } from '@/src/lib/utils/countries';
import { confirmationSubmissionEmailSender26Ar } from '@/src/operators/emails/26-ar/submissions/confirmation-submission-email-sender';
import { priorityConfirmationSubmissionEmailSender26Ar } from '@/src/operators/emails/26-ar/submissions/priority-confirmation-submission-email-sender';
import { submissionNotifier } from '@/src/operators/slack/submission-notifier';
import { genderInferrer } from '@/src/operators/submissions/infer-gender';
import {
  getHack26BuenosAiresEvent,
  HACK_26_BA_EVENT_NAME,
} from '../_lib/event';

/**
 * Determine cohort based on event priority deadline
 */
function determineCohort(submissionDate: Date, event: Event): Cohort {
  if (!event.priorityDeadlineAt) {
    return 'final';
  }

  return submissionDate <= event.priorityDeadlineAt ? 'priority' : 'final';
}

/**
 * Check if submissions are still open
 */
function isSubmissionOpen(submissionDate: Date, event: Event): boolean {
  if (!event.finalDeadlineAt) {
    return true;
  }

  return submissionDate <= event.finalDeadlineAt;
}

function formatDeadline(date: Date): string {
  return `${new Intl.DateTimeFormat('en-US', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(date)} (America/Argentina/Buenos_Aires)`;
}

/**
 * Title case a string
 */
function titleCase(text: string): string {
  return text
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get the most common country from a list of members
 * Normalizes all countries to 2-letter ISO codes and returns the most common one
 */
function getMostCommonCountry(members: Array<{ country: string }>): string {
  // Normalize all countries to 2-letter ISO codes
  const normalizedCountries = members
    .map((m) => normalizeCountry(m.country))
    .filter((c) => c && c !== 'OTHER'); // Filter out OTHER values initially

  // If no valid countries after normalization, return OTHER
  if (normalizedCountries.length === 0) {
    return 'OTHER';
  }

  const countryCounts = new Map<string, number>();

  for (const country of normalizedCountries) {
    const count = countryCounts.get(country) || 0;
    countryCounts.set(country, count + 1);
  }

  let mostCommonCountry = normalizedCountries[0];
  let maxCount = 0;

  for (const [country, count] of countryCounts.entries()) {
    if (count > maxCount) {
      maxCount = count;
      mostCommonCountry = country;
    }
  }

  return mostCommonCountry;
}

async function getOrCreateHacker(
  email: string,
  fullName: string,
  github: string | undefined,
  linkedin: string | undefined,
) {
  const normalizedEmail = email.toLowerCase();
  const normalizedGithub = github?.toLowerCase();
  const normalizedFullName = titleCase(fullName);

  const [existingHacker] = await db
    .select()
    .from(hackers)
    .where(eq(hackers.email, normalizedEmail))
    .limit(1);

  if (existingHacker) {
    return existingHacker;
  }

  let inferredGender: Gender | null = null;
  try {
    const genderResult = await genderInferrer.inferFromName(normalizedFullName);
    inferredGender = genderResult.gender;
    console.log(
      `Inferred gender for ${normalizedFullName}: ${genderResult.gender} (${(genderResult.confidence * 100).toFixed(0)}% confidence)`,
    );
  } catch (error) {
    console.error(`Failed to infer gender for ${normalizedFullName}:`, error);
  }

  const [newHacker] = await db
    .insert(hackers)
    .values({
      email: normalizedEmail,
      fullName: normalizedFullName,
      github: normalizedGithub || null,
      linkedin: linkedin?.toLowerCase() || null,
      gender: inferredGender,
    })
    .returning();

  return newHacker;
}

export async function submitApplicationAction(
  data: ApplicationFormData,
): Promise<{
  success: boolean;
  submissionId?: string;
  message?: string;
  error?: string;
}> {
  try {
    // Validate
    const validatedData = applicationSchema.parse(data);
    const event = await getHack26BuenosAiresEvent();

    if (!event) {
      return {
        success: false,
        error: `Event "${HACK_26_BA_EVENT_NAME}" not found. Please contact support.`,
      };
    }

    if (validatedData.modality !== 'team') {
      return {
        success: false,
        error:
          'For Buenos Aires applications, only team modality is available.',
      };
    }

    // Check if submissions are still open
    const submissionDate = new Date();
    if (!isSubmissionOpen(submissionDate, event)) {
      const deadlineText = event.finalDeadlineAt
        ? formatDeadline(event.finalDeadlineAt)
        : 'the configured deadline';

      return {
        success: false,
        error: `Applications are now closed for ${event.name}. The deadline was ${deadlineText}.`,
      };
    }

    const cohort = determineCohort(submissionDate, event);

    // Use transaction for atomicity
    const result = await db.transaction(async (tx) => {
      // Determine the correct modality for the database
      // If team with 'looking' status, use 'team_looking', otherwise use the form modality
      const dbModality =
        validatedData.modality === 'team' &&
        validatedData.teamStatus === 'looking'
          ? 'team_looking'
          : validatedData.modality;

      // Create submission without team
      const [submission] = await tx
        .insert(submissions)
        .values({
          eventId: event.id,
          teamId: null,
          tallySubmissionId: `app-${Date.now()}-${crypto.randomUUID()}`,
          rawPayload: validatedData as any,
          isTeam: validatedData.modality === 'team',
          modality: dbModality,
          status: 'received',
          cohort,
          country: getMostCommonCountry(validatedData.members),
          source: 'in-house',
          submittedAt: submissionDate,
        })
        .returning();

      // Create hackers and profiles (no team creation)
      const createdHackers = [];
      for (let i = 0; i < validatedData.members.length; i++) {
        const member = validatedData.members[i];

        // Get or create hacker (reuses if exists)
        const hacker = await getOrCreateHacker(
          member.email,
          member.fullName,
          member.githubProfile,
          member.linkedinProfile,
        );

        // Create hacker profile
        await tx.insert(hackerProfiles).values({
          hackerId: hacker.id,
          submissionId: submission.id,
          age: member.age,
          bio: member.builderDescription,
          education: member.education,
          isVeteran: member.isVeteran,
          previousHackathons: member.previousHackathons,
          shirtSize: member.shirtSize,
          diet: member.diet,
          allergies: member.foodAllergies,
          physicalIssues: member.physicalIssues,
          shareInfoWithSponsors: member.shareWithSponsors,
          country: member.country,
        });

        createdHackers.push({
          ...hacker,
          ...member,
        });
      }

      return {
        success: true,
        submissionId: submission.id,
        message: 'Team application submitted successfully!',
        submission,
        hackers: createdHackers,
      };
    });

    // Send Slack notification (blocking with error handling)
    try {
      await submissionNotifier.notifyNewSubmission(
        {
          submissionId: result.submission.id,
          isSolo: false,
          isTeamLooking: validatedData.teamStatus === 'looking',
          hackersCount: validatedData.members.length,
          hackerNames: validatedData.members.map((m) => m.fullName),
          hackers: result.hackers.map((h) => ({
            fullName: h.fullName,
            email: h.email,
            country: h.country,
            age: h.age,
            github: h.github,
            linkedin: h.linkedin,
            bio: h.builderDescription,
            education: h.education,
            roles: h.roles,
            isVeteran: h.isVeteran,
            previousHackathons: h.previousHackathons || null,
            shirtSize: h.shirtSize,
            diet: h.diet,
          })),
          eventSuggestions: validatedData.eventSuggestions,
        },
        event,
      );
    } catch (err) {
      console.error('Failed to send Slack notification for submission:', {
        submissionId: result.submission.id,
        modality: validatedData.modality,
        hackersCount: validatedData.members.length,
        error: err,
      });
      // Don't throw - allow submission to succeed even if notification fails
    }

    // Send confirmation email to all team members (blocking with error handling)
    try {
      if (cohort === 'priority') {
        await priorityConfirmationSubmissionEmailSender26Ar.sendToAllMembers({
          submissionId: result.submission.id,
          sentByUserId: 'bf24b2ab-c853-442f-847b-ba33ab96f3d9',
        });
      } else {
        await confirmationSubmissionEmailSender26Ar.sendToAllMembers({
          submissionId: result.submission.id,
          sentByUserId: 'bf24b2ab-c853-442f-847b-ba33ab96f3d9',
        });
      }
    } catch (err) {
      console.error('Failed to send confirmation emails for submission:', {
        submissionId: result.submission.id,
        modality: validatedData.modality,
        hackersCount: validatedData.members.length,
        error: err,
      });
      // Don't throw - allow submission to succeed even if email fails
    }

    revalidatePath('/26-ar/apply');
    return {
      success: result.success,
      submissionId: result.submissionId,
      message: result.message,
    };
  } catch (error) {
    console.error('Application submission error:', error);

    // Handle validation errors
    if (error instanceof Error && error.message.includes('validation')) {
      return {
        success: false,
        error: 'Please fill in all required fields correctly',
      };
    }

    // Handle database constraint violations
    if (error instanceof Error) {
      if (error.message.includes('unique constraint')) {
        return {
          success: false,
          error:
            'This submission appears to be a duplicate. Please contact support if this is an error.',
        };
      }

      if (error.message.includes('foreign key')) {
        return {
          success: false,
          error:
            'Invalid event or data reference. Please refresh the page and try again.',
        };
      }
    }

    // Generic error
    return {
      success: false,
      error:
        'Failed to submit application. Please try again or contact support.',
    };
  }
}
