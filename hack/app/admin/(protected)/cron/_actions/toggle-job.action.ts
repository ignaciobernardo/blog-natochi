'use server';

import { revalidatePath } from 'next/cache';
import { onlyAdminFull } from '@/src/lib/auth/server';
import { toggleCronjobEnabled } from '@/src/queries/cronjobs';

export async function toggleJobAction(jobName: string, enabled: boolean) {
  try {
    await onlyAdminFull();

    await toggleCronjobEnabled(jobName, enabled);

    revalidatePath('/admin/cron');

    return {
      success: true,
      message: `Job ${enabled ? 'enabled' : 'disabled'} successfully`,
    };
  } catch (error) {
    console.error('Toggle job error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to toggle job',
    };
  }
}
