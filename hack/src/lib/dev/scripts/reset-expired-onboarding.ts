import { eq } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import { submissions } from '@/src/lib/db/schema';

async function resetExpiredOnboarding() {
  try {
    console.log('Starting to reset expired onboarding submissions...');

    const result = await db
      .update(submissions)
      .set({ status: 'onboarding_request' })
      .where(eq(submissions.status, 'onboarding_expired'))
      .returning({ id: submissions.id });

    console.log(`✅ Successfully updated ${result.length} submissions`);
    console.log(
      `Submission IDs updated: ${result.map((r) => r.id).join(', ')}`,
    );
  } catch (error) {
    console.error('❌ Error resetting expired onboarding:', error);
    throw error;
  }
}

resetExpiredOnboarding()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
