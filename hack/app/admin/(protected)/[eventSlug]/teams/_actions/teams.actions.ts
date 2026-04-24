'use server';

import { revalidateAdminEventPathByEventId } from '@/src/lib/admin/revalidate';
import { onlyAdmin } from '@/src/lib/auth/server';
import {
  type CreateTeamFormData,
  createTeamFormSchema,
} from '@/src/lib/schemas/teams.schema';
import {
  type FormActionState,
  handleCommonError,
  isCommonError,
} from '@/src/lib/utils/forms';
import { getMentorById } from '@/src/queries/mentors';
import {
  addHackerToTeam,
  createTeam,
  getTeamById,
  removeHackerFromTeam,
  searchAvailableHackers,
  updateTeam,
} from '@/src/queries/teams';
import { getTrackById } from '@/src/queries/tracks';

export async function createTeamAction(
  data: CreateTeamFormData & { eventId: string },
): Promise<FormActionState<CreateTeamFormData>> {
  try {
    await onlyAdmin();

    const validatedData = createTeamFormSchema.parse(data);

    const team = await createTeam({
      eventId: data.eventId,
      slug: validatedData.slug,
      tableNumber: validatedData.tableNumber || null,
      formedOnSite: false,
      trackId: null,
    });

    await revalidateAdminEventPathByEventId(data.eventId, 'teams');
    await revalidateAdminEventPathByEventId(data.eventId, 'teams', team.id);

    return {
      success: true,
      data: validatedData,
      message: 'Team created successfully',
    };
  } catch (error) {
    if (isCommonError(error)) {
      return handleCommonError<CreateTeamFormData>(error);
    }

    console.error('Create team error:', error);
    return {
      success: false,
      globalError:
        error instanceof Error
          ? error.message
          : 'Failed to create team. Please try again.',
    };
  }
}

export async function searchHackersAction(query: string) {
  try {
    await onlyAdmin();

    if (!query || query.length < 2) {
      return { success: true, hackers: [] };
    }

    const hackers = await searchAvailableHackers(query);

    return { success: true, hackers };
  } catch (error) {
    console.error('Search hackers error:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to search hackers. Please try again.',
    };
  }
}

export async function addHackerToTeamAction(
  hackerProfileId: string,
  teamId: string,
) {
  try {
    await onlyAdmin();
    const team = await getTeamById(teamId);

    if (!team) {
      return {
        success: false,
        error: 'Team not found',
      };
    }

    await addHackerToTeam(hackerProfileId, teamId);

    await revalidateAdminEventPathByEventId(team.eventId, 'teams');
    await revalidateAdminEventPathByEventId(team.eventId, 'teams', teamId);

    return { success: true, message: 'Hacker added to team successfully' };
  } catch (error) {
    console.error('Add hacker to team error:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to add hacker to team. Please try again.',
    };
  }
}

export async function removeHackerFromTeamAction(
  hackerProfileId: string,
  teamId: string,
) {
  try {
    await onlyAdmin();
    const team = await getTeamById(teamId);

    if (!team) {
      return {
        success: false,
        error: 'Team not found',
      };
    }

    await removeHackerFromTeam(hackerProfileId);

    await revalidateAdminEventPathByEventId(team.eventId, 'teams');
    await revalidateAdminEventPathByEventId(team.eventId, 'teams', teamId);

    return {
      success: true,
      message: 'Hacker removed from team successfully',
    };
  } catch (error) {
    console.error('Remove hacker from team error:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to remove hacker from team. Please try again.',
    };
  }
}

export async function updateTeamAction(
  teamId: string,
  data: {
    tableNumber?: string | null;
    trackId?: string | null;
    mentorId?: string | null;
  },
) {
  try {
    await onlyAdmin();
    const team = await getTeamById(teamId);

    if (!team) {
      return {
        success: false,
        error: 'Team not found',
      };
    }

    if (data.trackId) {
      const track = await getTrackById(data.trackId, team.eventId);

      if (!track) {
        return {
          success: false,
          error: 'Track not found for this event',
        };
      }
    }

    if (data.mentorId) {
      const mentor = await getMentorById(data.mentorId, team.eventId);

      if (!mentor) {
        return {
          success: false,
          error: 'Mentor not found for this event',
        };
      }
    }

    await updateTeam(teamId, data);

    await revalidateAdminEventPathByEventId(team.eventId, 'teams');
    await revalidateAdminEventPathByEventId(team.eventId, 'teams', teamId);

    return { success: true, message: 'Team updated successfully' };
  } catch (error) {
    console.error('Update team error:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to update team. Please try again.',
    };
  }
}
