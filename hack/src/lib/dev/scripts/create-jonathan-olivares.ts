import { db } from '@/src/lib/db';
import { hackerProfiles, hackers, submissions } from '@/src/lib/db/schema';

async function main() {
  // Platanus Hack 25 event ID
  const eventId = 'c1d62fec-80e9-412f-8930-a8738d2c7a16';

  const [hacker] = await db
    .insert(hackers)
    .values({
      email: 'jon@than.cl',
      fullName: 'Jonathan Olivares',
      github: 'https://github.com/jcoruiz',
      gender: 'male',
    })
    .returning();

  console.log('Created hacker:', hacker.id);

  const [submission] = await db
    .insert(submissions)
    .values({
      eventId,
      tallySubmissionId: `manual-jonathan-olivares-${Date.now()}`,
      rawPayload: {
        modality: 'solo',
        members: [
          {
            fullName: 'Jonathan Olivares',
            country: 'CL',
            githubProfile: 'https://github.com/jcoruiz',
            email: 'jon@than.cl',
            age: 40,
            shirtSize: 'XL',
          },
        ],
      },
      isTeam: false,
      modality: 'solo',
      status: 'received',
      cohort: 'final',
      country: 'CL',
      source: 'in-house',
    })
    .returning();

  console.log('Created submission:', submission.id);

  const [profile] = await db
    .insert(hackerProfiles)
    .values({
      hackerId: hacker.id,
      submissionId: submission.id,
      age: 40,
      shirtSize: 'XL',
      country: 'CL',
      isVeteran: false,
      shareInfoWithSponsors: false,
      onboardCompleteAt: null,
    })
    .returning();

  console.log('Created hacker profile:', profile.id);
  console.log('Done!');
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
