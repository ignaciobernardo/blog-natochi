import { eq } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import { hackerProfiles, hackers, submissions } from '@/src/lib/db/schema';

async function updateHackerGithub() {
  console.log('Finding hacker with GitHub username: ignacio-urrutia...');

  // Find the hacker
  const hacker = await db.query.hackers.findFirst({
    where: eq(hackers.github, 'ignacio-urrutia'),
  });

  if (!hacker) {
    console.log('No hacker found with GitHub username: ignacio-urrutia');
    return;
  }

  console.log(`Found hacker: ${hacker.fullName} (ID: ${hacker.id})`);

  // Update the hacker's GitHub username
  await db
    .update(hackers)
    .set({ github: 'rafafdz' })
    .where(eq(hackers.id, hacker.id));

  console.log('Updated GitHub username to: rafafdz');

  // Find all hacker profiles for this hacker
  const profiles = await db.query.hackerProfiles.findMany({
    where: eq(hackerProfiles.hackerId, hacker.id),
    with: {
      submission: true,
    },
  });

  console.log(`Found ${profiles.length} hacker profile(s)`);

  for (const profile of profiles) {
    // Update the hacker profile to remove onboarding info
    await db
      .update(hackerProfiles)
      .set({
        termsAcceptedAt: null,
        discordId: null,
        discordUsername: null,
        discordConnectedAt: null,
        anthropicOrgId: null,
        anthropicUsedProducts: null,
        anthropicAccountEmail: null,
        anthropicUpdates: null,
        anthropicInfoSentAt: null,
        onboardCompleteAt: null,
      })
      .where(eq(hackerProfiles.id, profile.id));

    console.log(`Cleared onboarding info from profile ${profile.id}`);

    // Update the associated submission to 'onboarding_request'
    await db
      .update(submissions)
      .set({ status: 'onboarding_request' })
      .where(eq(submissions.id, profile.submissionId));

    console.log(
      `Updated submission ${profile.submissionId} to status: onboarding_request`,
    );
  }

  console.log('✅ All updates completed successfully!');
}

updateHackerGithub()
  .then(() => {
    console.log('Script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
