'use server';

import { revalidatePath } from 'next/cache';
import { onlyAdminFull } from '@/src/lib/auth/server';
import { deleteAdminByEmail, getAdminByEmail } from '@/src/queries/admins';

export async function deleteAdminAction(adminEmail: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const currentUser = await onlyAdminFull();

    if (currentUser.email === adminEmail) {
      return {
        success: false,
        error: 'You cannot delete your own account',
      };
    }

    const targetAdmin = await getAdminByEmail(adminEmail);

    if (!targetAdmin) {
      return {
        success: false,
        error: 'Admin user not found',
      };
    }

    await deleteAdminByEmail(adminEmail);

    revalidatePath('/admin/users');

    return {
      success: true,
      message: 'Admin user deleted successfully',
    };
  } catch (error) {
    console.error('Delete admin error:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to delete admin user. Please try again.',
    };
  }
}
