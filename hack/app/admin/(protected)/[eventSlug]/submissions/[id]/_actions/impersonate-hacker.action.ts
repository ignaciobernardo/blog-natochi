'use server';

import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { auth } from '@/src/lib/auth';
import { onlyAdminFull } from '@/src/lib/auth/server';
import { db } from '@/src/lib/db';
import { user } from '@/src/lib/db/schema';

export async function impersonateHackerAction(hackerId: string) {
  try {
    await onlyAdminFull();

    const [hackerUser] = await db
      .select()
      .from(user)
      .where(eq(user.linkedId, hackerId))
      .limit(1);

    if (!hackerUser) {
      return {
        success: false,
        error: 'User not found for this hacker',
      };
    }

    await auth.api.impersonateUser({
      headers: await headers(),
      body: {
        userId: hackerUser.id,
      },
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error('Failed to impersonate hacker:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to impersonate user',
    };
  }
}
