import { eq } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import { hackers } from '@/src/lib/db/schema';

/**
 * Fix duplicate hacker record for D3kai
 * Updates the old Hack 24 record to have a different GitHub URL
 * so it doesn't conflict with the current Hack 25 record
 */
async function fixD3kaiDuplicate() {
  console.log('Starting D3kai duplicate fix...');

  const oldHackerId = 'bae82157-4d17-4de7-bb0a-d7c18370e268';
  const oldGithubUrl = 'https://github.com/d3kai';
  const newGithubUrl = 'https://github.com/d3kai-old';

  try {
    // Update the old hacker record
    const result = await db
      .update(hackers)
      .set({ github: newGithubUrl })
      .where(eq(hackers.id, oldHackerId))
      .returning();

    if (result.length === 0) {
      console.log('❌ No hacker found with that ID');
      return;
    }

    console.log('✅ Successfully updated old hacker record:');
    console.log(`   ID: ${result[0].id}`);
    console.log(`   Name: ${result[0].fullName}`);
    console.log(`   Email: ${result[0].email}`);
    console.log(`   Old GitHub: ${oldGithubUrl}`);
    console.log(`   New GitHub: ${result[0].github}`);
    console.log('');
    console.log(
      'D3kai should now be able to log in with their GitHub account!',
    );
  } catch (error) {
    console.error('❌ Error updating hacker record:', error);
    throw error;
  }
}

fixD3kaiDuplicate()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
