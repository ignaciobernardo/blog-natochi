import { count, eq } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import { publicVotes } from '@/src/lib/db/schema';

export async function getUserVoteCount(userId: string): Promise<number> {
  const result = await db
    .select({ count: count() })
    .from(publicVotes)
    .where(eq(publicVotes.userId, userId));

  return result[0]?.count || 0;
}

export async function getProjectVoteCount(projectId: string): Promise<number> {
  const result = await db
    .select({ count: count() })
    .from(publicVotes)
    .where(eq(publicVotes.projectId, projectId));

  return result[0]?.count || 0;
}
