import { and, eq } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import { account } from '@/src/lib/db/schema';

export async function hasGoogleAccount(userId: string): Promise<boolean> {
  const googleAccount = await db
    .select()
    .from(account)
    .where(and(eq(account.userId, userId), eq(account.providerId, 'google')))
    .limit(1);
  return googleAccount.length > 0;
}
