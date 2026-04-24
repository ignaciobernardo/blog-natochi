'use server';

import { eq } from 'drizzle-orm';
import { revalidateAdminEventPathByEventId } from '@/src/lib/admin/revalidate';
import { onlyAdmin } from '@/src/lib/auth/server';
import { db } from '@/src/lib/db';
import { projects } from '@/src/lib/db/schema';
import {
  type UpdateProjectFormData,
  updateProjectFormSchema,
} from '@/src/lib/schemas/project-admin.schema';
import {
  type FormActionState,
  handleCommonError,
  isCommonError,
} from '@/src/lib/utils/forms';
import { getProjectById } from '@/src/queries/projects';
import { getTeamById } from '@/src/queries/teams';

export async function updateProjectAction(
  projectId: string,
  data: UpdateProjectFormData,
): Promise<FormActionState<UpdateProjectFormData>> {
  try {
    await onlyAdmin();

    const validatedData = updateProjectFormSchema.parse(data);

    await db
      .update(projects)
      .set({
        onelinerShort: validatedData.onelinerShort,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, projectId));

    const project = await getProjectById(projectId);
    const team = project ? await getTeamById(project.teamId) : null;

    if (team) {
      await revalidateAdminEventPathByEventId(
        team.eventId,
        'projects',
        projectId,
      );
      await revalidateAdminEventPathByEventId(team.eventId, 'projects');
    }

    return {
      success: true,
      data: validatedData,
      message: 'Project updated successfully!',
    };
  } catch (error) {
    if (isCommonError(error)) {
      return handleCommonError<UpdateProjectFormData>(error);
    }

    console.error('Update project error:', error);
    return {
      success: false,
      globalError:
        error instanceof Error
          ? error.message
          : 'Failed to update project. Please try again.',
    };
  }
}
