import { eq } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import { hackers } from '@/src/lib/db/schema';

async function verifyUpdate() {
  console.log('Verifying GitHub URL update...\n');

  const hacker = await db.query.hackers.findFirst({
    where: eq(hackers.id, '6e1991d3-013d-4726-be28-79f21f364cd8'),
    columns: { id: true, fullName: true, github: true, email: true },
  });

  if (!hacker) {
    console.log('❌ Hacker not found');
    return;
  }

  console.log(`Hacker: ${hacker.fullName}`);
  console.log(`Email: ${hacker.email}`);
  console.log(`GitHub URL: ${hacker.github}`);

  if (hacker.github === 'https://github.com/dreamxist') {
    console.log('\n✅ Update verified successfully!');
  } else {
    console.log('\n❌ GitHub URL does not match expected value');
  }
}

verifyUpdate()
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  });
