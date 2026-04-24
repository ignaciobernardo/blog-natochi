import { eq } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import { hackers } from '@/src/lib/db/schema';

async function fixAlasAltumDuplicate() {
  console.log('=== Fixing AlasAltum Duplicate GitHub URLs ===\n');

  const sebastianId = 'c342a248-22e2-41f7-bfad-a1aae350b5af';
  const _alonsoId = '42aa4fce-6da1-4ccc-a424-fafbe47d69c6';

  // Get current state
  console.log('Current state:');
  const currentHackers = await db
    .select({
      id: hackers.id,
      fullName: hackers.fullName,
      email: hackers.email,
      github: hackers.github,
    })
    .from(hackers)
    .where(eq(hackers.id, sebastianId));

  for (const hacker of currentHackers) {
    console.log(`  ${hacker.fullName} (${hacker.email})`);
    console.log(`  GitHub: ${hacker.github}\n`);
  }

  // Update Sebastián Muñoz to use alasaltum-old
  console.log('Updating Sebastián Muñoz GitHub URL to alasaltum-old...');
  await db
    .update(hackers)
    .set({ github: 'https://github.com/alasaltum-old' })
    .where(eq(hackers.id, sebastianId));

  console.log('✓ Updated\n');

  // Verify the change
  console.log('Verification:');
  const updatedHackers = await db
    .select({
      id: hackers.id,
      fullName: hackers.fullName,
      email: hackers.email,
      github: hackers.github,
    })
    .from(hackers)
    .where(eq(hackers.id, sebastianId));

  for (const hacker of updatedHackers) {
    console.log(`  ${hacker.fullName} (${hacker.email})`);
    console.log(`  GitHub: ${hacker.github}`);
  }

  console.log('\nAlonso Utreras should now be able to login with @AlasAltum');
}

fixAlasAltumDuplicate()
  .then(() => {
    console.log('\n✓ Fix complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
