'use server';

import { hashPassword } from 'better-auth/crypto';
import { revalidatePath } from 'next/cache';
import { onlyAdminFull } from '@/src/lib/auth/server';
import { getAdminByEmail, updateAdminPassword } from '@/src/queries/admins';

function generateSecurePassword(): string {
  const chars =
    'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&*';
  let password = '';
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export async function resetPasswordAction(adminEmail: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  password?: string;
}> {
  try {
    const _currentUser = await onlyAdminFull();

    const targetAdmin = await getAdminByEmail(adminEmail);

    if (!targetAdmin) {
      return {
        success: false,
        error: 'Admin user not found',
      };
    }

    const newPassword = generateSecurePassword();
    const hashedPassword = await hashPassword(newPassword);

    await updateAdminPassword(adminEmail, hashedPassword);

    revalidatePath('/admin/users');

    return {
      success: true,
      message: 'Password reset successfully',
      password: newPassword,
    };
  } catch (error) {
    console.error('Reset password error:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to reset password. Please try again.',
    };
  }
}
