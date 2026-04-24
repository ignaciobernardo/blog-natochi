import { like } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import { hackers } from '@/src/lib/db/schema';

async function searchFrancisco() {
  console.log('Searching for hackers with "francisco" in GitHub field...\n');

  const results = await db.query.hackers.findMany({
    where: like(hackers.github, '%francisco%'),
    columns: { id: true, fullName: true, github: true, email: true },
  });

  console.log(`Found ${results.length} hackers:\n`);

  for (const hacker of results) {
    console.log(`- ${hacker.fullName} (${hacker.email})`);
    console.log(`  GitHub: ${hacker.github}`);
    console.log(`  ID: ${hacker.id}\n`);
  }
}

searchFrancisco()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  });
