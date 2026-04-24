import { eq } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import { hackers } from '@/src/lib/db/schema';

async function updateGithubUsername() {
  console.log(
    'Finding hacker with GitHub URL: https://github.com/franciscozunigap...\n',
  );

  const hacker = await db.query.hackers.findFirst({
    where: eq(hackers.github, 'https://github.com/franciscozunigap'),
  });

  if (!hacker) {
    console.log(
      '❌ No hacker found with GitHub URL: https://github.com/franciscozunigap',
    );
    return;
  }

  console.log(`✓ Found hacker: ${hacker.fullName} (ID: ${hacker.id})`);
  console.log(`  Email: ${hacker.email}`);
  console.log(`  Current GitHub: ${hacker.github}\n`);

  const [updatedHacker] = await db
    .update(hackers)
    .set({ github: 'https://github.com/dreamxist' })
    .where(eq(hackers.id, hacker.id))
    .returning();

  console.log('✅ Updated GitHub URL:');
  console.log(`  Old: https://github.com/franciscozunigap`);
  console.log(`  New: ${updatedHacker.github}`);
}

updateGithubUsername()
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  });
