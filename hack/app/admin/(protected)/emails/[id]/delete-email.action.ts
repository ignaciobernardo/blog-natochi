'use server';

import { revalidatePath } from 'next/cache';
import { onlyAdmin } from '@/src/lib/auth/server';
import { deleteOutboundEmail, getOutboundEmail } from '@/src/queries/emails';

export async function deleteEmailAction(emailId: string) {
  try {
    await onlyAdmin();

    const email = await getOutboundEmail(emailId);
    if (!email) {
      return { success: false, error: 'Email record not found' };
    }

    if (email.status !== 'pending') {
      return {
        success: false,
        error: 'Only pending emails can be deleted',
      };
    }

    await deleteOutboundEmail(emailId);

    revalidatePath('/admin/emails');

    return { success: true, message: 'Email deleted successfully!' };
  } catch (error) {
    console.error('Delete email error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete email',
    };
  }
}
