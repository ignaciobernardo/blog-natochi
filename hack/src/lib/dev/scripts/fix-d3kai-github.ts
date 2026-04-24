import { eq } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import { hackers } from '@/src/lib/db/schema';

const OLD_HACKER_ID = 'bae82157-4d17-4de7-bb0a-d7c18370e268';

async function fixGithubUrl() {
  console.log('Fixing d3kai GitHub URL conflict...\n');

  try {
    // Update the old hacker's GitHub URL to include a suffix to avoid conflicts
    const [updatedHacker] = await db
      .update(hackers)
      .set({
        github: 'https://github.com/d3kai-old-archived',
      })
      .where(eq(hackers.id, OLD_HACKER_ID))
      .returning();

    console.log('✓ Updated old hacker record:');
    console.log(`  ID: ${updatedHacker.id}`);
    console.log(`  Email: ${updatedHacker.email}`);
    console.log(`  Old GitHub: https://github.com/d3kai-old`);
    console.log(`  New GitHub: ${updatedHacker.github}`);

    console.log('\n✅ Fix completed! D3kai can now sign in with GitHub.');
  } catch (error) {
    console.error('❌ Error fixing GitHub URL:', error);
    throw error;
  }
}

fixGithubUrl()
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  });
