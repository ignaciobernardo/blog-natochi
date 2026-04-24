import { sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { cronJobs, shouldRunJob } from '@/src/jobs/cron';
import { db } from '@/src/lib/db';
import {
  getAllCronjobs,
  updateCronjobLastRun,
  upsertCronjob,
} from '@/src/queries/cronjobs';

const CRON_TICK_LOCK_KEY = 258601;

export async function GET() {
  try {
    const response = await db.transaction(async (tx) => {
      const lockResult = (await tx.execute(sql`
        SELECT pg_try_advisory_xact_lock(${CRON_TICK_LOCK_KEY}) AS acquired
      `)) as { rows?: { acquired: boolean }[] } | { acquired: boolean }[];

      const lockRows = Array.isArray(lockResult)
        ? lockResult
        : lockResult.rows || [];
      const lockAcquired = lockRows[0]?.acquired === true;

      if (!lockAcquired) {
        return NextResponse.json({
          success: true,
          skipped: true,
          reason: 'tick-already-running',
          timestamp: new Date().toISOString(),
        });
      }

      const now = new Date();
      const results: {
        job: string;
        status: 'executed' | 'skipped' | 'error';
        error?: string;
      }[] = [];

      const dbJobs = await getAllCronjobs();
      const dbJobsMap = new Map(dbJobs.map((job) => [job.jobName, job]));

      for (const jobDef of cronJobs) {
        let dbJob = dbJobsMap.get(jobDef.name);

        if (!dbJob) {
          dbJob = await upsertCronjob({
            jobName: jobDef.name,
            schedule: jobDef.schedule,
            enabled: true,
            lastRun: null,
          });
        }

        if (!dbJob.enabled) {
          results.push({
            job: jobDef.name,
            status: 'skipped',
          });
          continue;
        }

        if (!shouldRunJob(jobDef.schedule, dbJob.lastRun, now)) {
          results.push({
            job: jobDef.name,
            status: 'skipped',
          });
          continue;
        }

        results.push({
          job: jobDef.name,
          status: 'executed',
        });
      }

      const jobsToExecute = results
        .filter((r) => r.status === 'executed')
        .map((r) => r.job);

      const executionPromises = jobsToExecute.map(async (jobName) => {
        const jobDef = cronJobs.find((j) => j.name === jobName);
        if (!jobDef) return;

        try {
          await jobDef.callback();
          await updateCronjobLastRun(jobName, now);
        } catch (error) {
          console.error(`[CRON] Error executing job ${jobName}:`, error);
          const result = results.find((r) => r.job === jobName);
          if (result) {
            result.status = 'error';
            result.error =
              error instanceof Error ? error.message : 'Unknown error';
          }
        }
      });

      await Promise.all(executionPromises);

      return NextResponse.json({
        success: true,
        timestamp: now.toISOString(),
        results,
      });
    });

    return response;
  } catch (error) {
    console.error('[CRON] Tick error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
