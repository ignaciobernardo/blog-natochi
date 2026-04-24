import { db } from '../../db/index';
import { hackerProfiles } from '../../db/schema';

async function checkTermsColumn() {
  // Query using Drizzle ORM
  const profiles = await db.select().from(hackerProfiles).limit(3);

  console.log('Number of profiles:', profiles.length);

  if (profiles.length > 0) {
    console.log('\nFirst profile:');
    console.log('- id:', profiles[0].id);
    console.log('- termsAcceptedAt:', profiles[0].termsAcceptedAt);
    console.log('- discordId:', profiles[0].discordId);
    console.log('- anthropicAccountEmail:', profiles[0].anthropicAccountEmail);

    console.log('\nAll keys:', Object.keys(profiles[0]));
  }
}

checkTermsColumn()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
