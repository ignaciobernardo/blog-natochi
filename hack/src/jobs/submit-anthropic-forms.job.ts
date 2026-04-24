import { and, isNotNull, isNull } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import { hackerProfiles } from '@/src/lib/db/schema';
import { anthropicFormSubmitter } from '@/src/operators/anthropic/form-submitter';

const BATCH_SIZE = 50;

export async function submitAnthropicForms() {
  console.log('[CRON] 🤖 Submitting Anthropic forms...');

  const pendingProfiles = await db
    .select({ id: hackerProfiles.id })
    .from(hackerProfiles)
    .where(
      and(
        isNotNull(hackerProfiles.anthropicAccountEmail),
        isNotNull(hackerProfiles.anthropicOrgId),
        isNull(hackerProfiles.anthropicInfoSentAt),
      ),
    )
    .limit(BATCH_SIZE);

  if (pendingProfiles.length === 0) {
    console.log('[CRON] 🤖 No pending Anthropic forms to submit');
    return;
  }

  console.log(`[CRON] 🤖 Found ${pendingProfiles.length} profiles to submit`);

  const results = await Promise.allSettled(
    pendingProfiles.map((profile) =>
      anthropicFormSubmitter.submit({ hackerProfileId: profile.id }),
    ),
  );

  const successful = results.filter(
    (r) => r.status === 'fulfilled' && r.value.success,
  ).length;
  const failed = results.length - successful;

  console.log(`[CRON] 🤖 Finished: ${successful} successful, ${failed} failed`);
}
