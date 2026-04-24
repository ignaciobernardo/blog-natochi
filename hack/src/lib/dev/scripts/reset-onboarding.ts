import { inArray } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import { hackerProfiles, hackers } from '@/src/lib/db/schema';

const emails = [
  'magio@magiobus.com',
  'kirabelak@kirabel.com',
  'elfora.dev@gmail.com',
];

async function resetOnboarding() {
  const targetHackers = await db
    .select({ id: hackers.id, email: hackers.email })
    .from(hackers)
    .where(inArray(hackers.email, emails));

  if (targetHackers.length === 0) {
    console.log('No hackers found with the specified emails');
    return;
  }

  console.log(`Found ${targetHackers.length} hackers:`);
  for (const hacker of targetHackers) {
    console.log(`  - ${hacker.email} (${hacker.id})`);
  }

  const hackerIds = targetHackers.map((h) => h.id);

  const result = await db
    .update(hackerProfiles)
    .set({ onboardCompleteAt: null })
    .where(inArray(hackerProfiles.hackerId, hackerIds))
    .returning({ id: hackerProfiles.id, hackerId: hackerProfiles.hackerId });

  console.log(`\nUpdated ${result.length} hacker profiles`);
  for (const profile of result) {
    const hacker = targetHackers.find((h) => h.id === profile.hackerId);
    console.log(`  - Profile ${profile.id} (${hacker?.email})`);
  }
}

resetOnboarding()
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
