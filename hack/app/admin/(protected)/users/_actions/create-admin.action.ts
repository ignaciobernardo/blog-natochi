'use server';

import { hashPassword } from 'better-auth/crypto';
import { v4 as uuidv4 } from 'uuid';
import { onlyAdminFull } from '@/src/lib/auth/server';
import {
  type CreateAdminFormData,
  createAdminSchema,
} from '@/src/lib/schemas/admin.schema';
import {
  type FormActionState,
  handleCommonError,
  isCommonError,
} from '@/src/lib/utils/forms';
import { createAdminUser, getAdminByEmail } from '@/src/queries/admins';

function generateSecurePassword(): string {
  const chars =
    'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&*';
  let password = '';
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export async function createAdminAction(
  data: CreateAdminFormData,
): Promise<FormActionState<CreateAdminFormData> & { password?: string }> {
  try {
    await onlyAdminFull();

    const validatedData = createAdminSchema.parse(data);

    const existingAdmin = await getAdminByEmail(validatedData.email);
    if (existingAdmin) {
      return {
        success: false,
        errors: {
          email: ['An admin with this email already exists'],
        },
      };
    }

    const password = generateSecurePassword();
    const hashedPassword = await hashPassword(password);

    await createAdminUser({
      email: validatedData.email,
      fullName: validatedData.fullName,
      role: validatedData.role,
      hashedPassword,
      userId: uuidv4(),
      adminId: uuidv4(),
    });

    return {
      success: true,
      data: validatedData,
      message: 'Admin user created successfully!',
      password,
    };
  } catch (error) {
    if (isCommonError(error)) {
      return handleCommonError<CreateAdminFormData>(error);
    }

    console.error('Create admin error:', error);
    return {
      success: false,
      globalError:
        error instanceof Error
          ? error.message
          : 'Failed to create admin user. Please try again.',
    };
  }
}
