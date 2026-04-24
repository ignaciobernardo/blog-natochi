import { eq } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import {
  type Cronjob,
  cronjobs,
  type InsertCronjob,
} from '@/src/lib/db/schema';

export async function getAllCronjobs(): Promise<Cronjob[]> {
  return db.select().from(cronjobs);
}

export async function getCronjobByName(
  jobName: string,
): Promise<Cronjob | null> {
  const [job] = await db
    .select()
    .from(cronjobs)
    .where(eq(cronjobs.jobName, jobName));
  return job || null;
}

export async function upsertCronjob(data: InsertCronjob): Promise<Cronjob> {
  const [job] = await db
    .insert(cronjobs)
    .values(data)
    .onConflictDoUpdate({
      target: cronjobs.jobName,
      set: {
        schedule: data.schedule,
        updatedAt: new Date(),
      },
    })
    .returning();
  return job;
}

export async function updateCronjobLastRun(
  jobName: string,
  lastRun: Date,
): Promise<void> {
  await db
    .update(cronjobs)
    .set({ lastRun, updatedAt: new Date() })
    .where(eq(cronjobs.jobName, jobName));
}

export async function toggleCronjobEnabled(
  jobName: string,
  enabled: boolean,
): Promise<Cronjob> {
  const [job] = await db
    .update(cronjobs)
    .set({ enabled, updatedAt: new Date() })
    .where(eq(cronjobs.jobName, jobName))
    .returning();
  return job;
}
