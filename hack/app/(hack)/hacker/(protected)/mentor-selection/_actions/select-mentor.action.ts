'use server';

import { and, eq, isNull, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { onlyHacker } from '@/src/lib/auth/server';
import { db } from '@/src/lib/db';
import { mentors, teams } from '@/src/lib/db/schema';
import type { FormActionState } from '@/src/lib/utils/forms';
import { getDefaultEvent } from '@/src/queries/events';

const selectMentorSchema = z.object({
  teamId: z.string().uuid(),
  mentorId: z.string().uuid(),
});

type SelectMentorData = z.infer<typeof selectMentorSchema>;

export async function selectMentorAction(
  data: SelectMentorData,
): Promise<FormActionState<SelectMentorData>> {
  try {
    const _currentUser = await onlyHacker();
    const validatedData = selectMentorSchema.parse(data);

    const event = await getDefaultEvent();

    if (!event) {
      return {
        success: false,
        globalError: 'Event not found',
      };
    }

    const now = new Date();
    if (
      !event.mentorSelectionStartTime ||
      now < event.mentorSelectionStartTime
    ) {
      return {
        success: false,
        globalError: 'Mentor selection is not open yet',
      };
    }

    // Use transaction with row-level locking to prevent race conditions
    const result = await db.transaction(async (tx) => {
      const [mentor] = await tx
        .select({
          id: mentors.id,
        })
        .from(mentors)
        .where(
          and(
            eq(mentors.id, validatedData.mentorId),
            eq(mentors.eventId, event.id),
          ),
        )
        .limit(1);

      if (!mentor) {
        throw new Error('Mentor not found for this event');
      }

      // First, verify team exists and hasn't selected a mentor yet
      const [team] = await tx
        .select({
          id: teams.id,
          mentorId: teams.mentorId,
        })
        .from(teams)
        .where(
          and(eq(teams.id, validatedData.teamId), eq(teams.eventId, event.id)),
        )
        .limit(1);

      if (!team) {
        throw new Error('Team not found');
      }

      if (team.mentorId) {
        throw new Error(
          'Your team has already selected a mentor and it cannot be changed',
        );
      }

      // Atomic update with capacity check in WHERE clause
      // This ensures the update only happens if capacity allows
      if (event.mentorTeamLimit) {
        // Use raw SQL for atomic update with capacity check
        const updateResult = await tx.execute<{ id: string }>(
          sql`
            UPDATE teams
            SET mentor_id = ${validatedData.mentorId}
            WHERE id = ${validatedData.teamId}
              AND event_id = ${event.id}
              AND mentor_id IS NULL
              AND (
                SELECT COUNT(*)::int
                FROM teams
                WHERE mentor_id = ${validatedData.mentorId}
                  AND event_id = ${event.id}
              ) < ${event.mentorTeamLimit}
            RETURNING id
          `,
        );

        if (!updateResult || updateResult.length === 0) {
          // Check if it's because capacity was exceeded
          const capacityCheckResult = await tx.execute<{ count: number }>(
            sql`
              SELECT COUNT(*)::int as count
              FROM teams
              WHERE mentor_id = ${validatedData.mentorId}
                AND event_id = ${event.id}
            `,
          );

          if (
            capacityCheckResult &&
            capacityCheckResult.length > 0 &&
            capacityCheckResult[0].count >= event.mentorTeamLimit
          ) {
            throw new Error(
              `This mentor has reached their limit of ${event.mentorTeamLimit} teams`,
            );
          }

          throw new Error(
            'Failed to select mentor - team may have already selected a mentor',
          );
        }
      } else {
        // No capacity limit - simple atomic update
        const [updatedTeam] = await tx
          .update(teams)
          .set({
            mentorId: validatedData.mentorId,
          })
          .where(
            and(
              eq(teams.id, validatedData.teamId),
              eq(teams.eventId, event.id),
              isNull(teams.mentorId),
            ),
          )
          .returning();

        if (!updatedTeam) {
          throw new Error(
            'Failed to select mentor - team may have already selected a mentor',
          );
        }
      }

      return {
        success: true,
        data: validatedData,
        message: 'Mentor selected successfully!',
      };
    });

    revalidatePath('/hacker/mentor-selection');

    return result;
  } catch (error) {
    console.error('Select mentor error:', error);
    return {
      success: false,
      globalError:
        error instanceof Error
          ? error.message
          : 'Failed to select mentor. Please try again.',
    };
  }
}
