'use server';

import { and, eq, isNull, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { onlyHacker } from '@/src/lib/auth/server';
import { db } from '@/src/lib/db';
import { teams, tracks } from '@/src/lib/db/schema';
import type { FormActionState } from '@/src/lib/utils/forms';
import { getDefaultEvent } from '@/src/queries/events';

const selectTrackSchema = z.object({
  teamId: z.string().uuid(),
  trackId: z.string().uuid(),
});

type SelectTrackData = z.infer<typeof selectTrackSchema>;

export async function selectTrackAction(
  data: SelectTrackData,
): Promise<FormActionState<SelectTrackData>> {
  try {
    const currentUser = await onlyHacker();
    const validatedData = selectTrackSchema.parse(data);

    const event = await getDefaultEvent();

    if (!event) {
      return {
        success: false,
        globalError: 'Event not found',
      };
    }

    const now = new Date();
    if (!event.trackSelectionStartTime || now < event.trackSelectionStartTime) {
      return {
        success: false,
        globalError: 'Track selection is not open yet',
      };
    }

    // Use transaction with row-level locking to prevent race conditions
    const result = await db.transaction(async (tx) => {
      const [track] = await tx
        .select({
          id: tracks.id,
        })
        .from(tracks)
        .where(
          and(
            eq(tracks.id, validatedData.trackId),
            eq(tracks.eventId, event.id),
          ),
        )
        .limit(1);

      if (!track) {
        throw new Error('Track not found for this event');
      }

      // First, verify team exists and hasn't selected a track yet
      const [team] = await tx
        .select({
          id: teams.id,
          trackId: teams.trackId,
        })
        .from(teams)
        .where(
          and(eq(teams.id, validatedData.teamId), eq(teams.eventId, event.id)),
        )
        .limit(1);

      if (!team) {
        throw new Error('Team not found');
      }

      if (team.trackId) {
        throw new Error(
          'Your team has already selected a track and it cannot be changed',
        );
      }

      // Atomic update with capacity check in WHERE clause
      // This ensures the update only happens if capacity allows
      if (event.trackTeamLimit) {
        // Use raw SQL for atomic update with capacity check
        const updateResult = await tx.execute<{ id: string }>(
          sql`
            UPDATE teams
            SET track_id = ${validatedData.trackId},
                track_selector_id = ${currentUser.linkedId}
            WHERE id = ${validatedData.teamId}
              AND event_id = ${event.id}
              AND track_id IS NULL
              AND (
                SELECT COUNT(*)::int
                FROM teams
                WHERE track_id = ${validatedData.trackId}
                  AND event_id = ${event.id}
              ) < ${event.trackTeamLimit}
            RETURNING id
          `,
        );

        if (!updateResult || updateResult.length === 0) {
          // Check if it's because capacity was exceeded
          const capacityCheckResult = await tx.execute<{ count: number }>(
            sql`
              SELECT COUNT(*)::int as count
              FROM teams
              WHERE track_id = ${validatedData.trackId}
                AND event_id = ${event.id}
            `,
          );

          if (
            capacityCheckResult &&
            capacityCheckResult.length > 0 &&
            capacityCheckResult[0].count >= event.trackTeamLimit
          ) {
            throw new Error(
              `This track has reached its limit of ${event.trackTeamLimit} teams`,
            );
          }

          throw new Error(
            'Failed to select track - team may have already selected a track',
          );
        }
      } else {
        // No capacity limit - simple atomic update
        const [updatedTeam] = await tx
          .update(teams)
          .set({
            trackId: validatedData.trackId,
            trackSelectorId: currentUser.linkedId,
          })
          .where(
            and(
              eq(teams.id, validatedData.teamId),
              eq(teams.eventId, event.id),
              isNull(teams.trackId),
            ),
          )
          .returning();

        if (!updatedTeam) {
          throw new Error(
            'Failed to select track - team may have already selected a track',
          );
        }
      }

      return {
        success: true,
        data: validatedData,
        message: 'Track selected successfully!',
      };
    });

    revalidatePath('/hacker/track-selection');

    return result;
  } catch (error) {
    console.error('Select track error:', error);
    return {
      success: false,
      globalError:
        error instanceof Error
          ? error.message
          : 'Failed to select track. Please try again.',
    };
  }
}
