import { ilike, or } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import { hackers } from '@/src/lib/db/schema';

async function findHacker() {
  console.log('Searching for hackers with "ignacio" or "urrutia" in GitHub...');

  // Search for hackers with similar GitHub usernames (case-insensitive)
  const matchingHackers = await db
    .select()
    .from(hackers)
    .where(
      or(
        ilike(hackers.github, '%ignacio%'),
        ilike(hackers.github, '%urrutia%'),
        ilike(hackers.fullName, '%ignacio%'),
        ilike(hackers.fullName, '%urrutia%'),
      ),
    );

  console.log(`Found ${matchingHackers.length} matching hacker(s):\n`);

  for (const hacker of matchingHackers) {
    console.log(`ID: ${hacker.id}`);
    console.log(`Full Name: ${hacker.fullName}`);
    console.log(`Email: ${hacker.email}`);
    console.log(`GitHub: ${hacker.github}`);
    console.log(`LinkedIn: ${hacker.linkedin}`);
    console.log('---');
  }

  // Also list all hackers to see what we have
  const allHackers = await db.select().from(hackers).limit(10);
  console.log(`\nShowing first 10 hackers in database:\n`);
  for (const hacker of allHackers) {
    console.log(
      `${hacker.fullName} - GitHub: ${hacker.github} - Email: ${hacker.email}`,
    );
  }
}

findHacker()
  .then(() => {
    console.log('\nScript finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
