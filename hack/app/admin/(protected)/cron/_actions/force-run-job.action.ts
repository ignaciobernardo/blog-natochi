'use server';

import { revalidatePath } from 'next/cache';
import { cronJobs } from '@/src/jobs/cron';
import { onlyAdminFull } from '@/src/lib/auth/server';
import { updateCronjobLastRun } from '@/src/queries/cronjobs';

export async function forceRunJobAction(jobName: string) {
  try {
    await onlyAdminFull();

    const jobDef = cronJobs.find((j) => j.name === jobName);

    if (!jobDef) {
      return {
        success: false,
        error: 'Job not found',
      };
    }

    const result = await jobDef.callback();

    await updateCronjobLastRun(jobName, new Date());

    revalidatePath('/admin/cron');

    // If job returns data (e.g., CSV), return it for download
    if (jobDef.returnsDownload && typeof result === 'string') {
      return {
        success: true,
        message: 'Job executed successfully',
        downloadData: result,
      };
    }

    return {
      success: true,
      message: 'Job executed successfully',
    };
  } catch (error) {
    console.error('Force run job error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to run job',
    };
  }
}
