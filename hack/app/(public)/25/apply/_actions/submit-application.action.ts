'use server';

import { desc, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/src/lib/db';
import {
  type Cohort,
  events,
  type Gender,
  hackerProfiles,
  hackers,
  submissions,
} from '@/src/lib/db/schema';
import { applicationSchema } from '@/src/lib/schemas/application.schema';
import type { ApplicationFormData } from '@/src/lib/types/application';
import { normalizeCountry } from '@/src/lib/utils/countries';
import { confirmationSubmissionEmailSender25 } from '@/src/operators/emails/25/submissions/confirmation-submission-email-sender';
import { submissionNotifier } from '@/src/operators/slack/submission-notifier';
import { genderInferrer } from '@/src/operators/submissions/infer-gender';

/**
 * Get the active event (assumes latest created event is active)
 * TODO: Add an 'is_active' flag to events table for better control
 */
async function getActiveEvent() {
  const [event] = await db
    .select()
    .from(events)
    .orderBy(desc(events.createdAt))
    .limit(1);

  if (!event) {
    throw new Error('No active event found');
  }

  return event;
}

/**
 * Determine cohort based on submission date
 * Priority deadline: October 15, 2024 at 23:59 Chile time (GMT-3)
 */
function determineCohort(submissionDate: Date): Cohort {
  // Priority deadline: end of October 15, 2024 in Chile (GMT-3) = Oct 16 02:59:59 UTC
  const priorityDeadline = new Date('2024-10-16T02:59:59.999Z');
  return submissionDate <= priorityDeadline ? 'priority' : 'final';
}

/**
 * Check if submissions are still open
 * Final deadline: November 11, 2025 at 0:10 AM Chile time (GMT-3)
 */
function isSubmissionOpen(submissionDate: Date): boolean {
  // Final deadline: Nov 11, 2025 00:10 in Chile (GMT-3) = Nov 11, 2025 03:10 UTC
  const finalDeadline = new Date('2025-11-11T03:10:00.000Z');
  return submissionDate <= finalDeadline;
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

    // Check if submissions are still open
    const submissionDate = new Date();
    if (!isSubmissionOpen(submissionDate)) {
      return {
        success: false,
        error:
          'Applications are now closed. The deadline was November 11, 2025 at 0:10 AM Chile time.',
      };
    }

    // Get active event
    const event = await getActiveEvent();
    const cohort = determineCohort(submissionDate);

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
        message:
          validatedData.modality === 'team'
            ? 'Team application submitted successfully!'
            : 'Solo application submitted successfully!',
        submission,
        hackers: createdHackers,
      };
    });

    // Send Slack notification (blocking with error handling)
    try {
      await submissionNotifier.notifyNewSubmission(
        {
          submissionId: result.submission.id,
          isSolo: validatedData.modality === 'solo',
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
      await confirmationSubmissionEmailSender25.sendToAllMembers({
        submissionId: result.submission.id,
        sentByUserId: 'bf24b2ab-c853-442f-847b-ba33ab96f3d9',
      });
    } catch (err) {
      console.error('Failed to send confirmation emails for submission:', {
        submissionId: result.submission.id,
        modality: validatedData.modality,
        hackersCount: validatedData.members.length,
        error: err,
      });
      // Don't throw - allow submission to succeed even if email fails
    }

    revalidatePath('/25/apply');
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

      if (error.message.includes('No active event')) {
        return {
          success: false,
          error: 'No active event found. Please contact support.',
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
