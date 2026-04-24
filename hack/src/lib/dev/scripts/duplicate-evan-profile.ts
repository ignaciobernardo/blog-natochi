import { eq } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import { hackerProfiles, submissions } from '@/src/lib/db/schema';

async function duplicateEvanProfile() {
  // Find the hacker
  const hackerEmail = 'weinbergmath@gmail.com';
  const hackerId = 'c08ee1ce-0b0a-4ceb-9f8a-8ab52262dd16';

  console.log('Finding existing hacker profile...');

  // Get the existing hacker profile
  const existingProfile = await db.query.hackerProfiles.findFirst({
    where: eq(hackerProfiles.hackerId, hackerId),
  });

  if (!existingProfile) {
    console.error('No existing profile found for hacker');
    return;
  }

  console.log('Found existing profile:', existingProfile.id);

  // Get the existing submission to understand the event
  const existingSubmission = await db.query.submissions.findFirst({
    where: eq(submissions.id, existingProfile.submissionId),
  });

  if (!existingSubmission) {
    console.error('No existing submission found');
    return;
  }

  console.log('Creating new submission...');

  // Create new submission with team_looking modality
  const newSubmission = await db
    .insert(submissions)
    .values({
      eventId: existingSubmission.eventId,
      teamId: null,
      tallySubmissionId: `in-house-evan-${Date.now()}`,
      rawPayload: {
        modality: 'team',
        teamStatus: 'looking',
        members: [
          {
            fullName: 'Evan Weinberg',
            country: 'US',
            githubProfile: 'https://github.com/emwdx',
            email: hackerEmail,
            linkedinProfile: 'https://linkedin.com/in/evan-weinberg-b89a858/',
            age: 44,
            builderDescription: existingProfile.bio,
            education: existingProfile.education,
            roles: ['diseno', 'producto', 'desarrollo'],
            isVeteran: false,
            shirtSize: 'M',
            diet: 'omnivora',
            shareWithSponsors: false,
          },
        ],
        eventSuggestions: '',
      },
      isTeam: true,
      modality: 'team_looking',
      status: 'received',
      cohort: existingSubmission.cohort,
      country: 'US',
      source: 'in-house',
    })
    .returning();

  console.log('Created new submission:', newSubmission[0].id);

  // Create new hacker profile associated with the new submission
  const newProfile = await db
    .insert(hackerProfiles)
    .values({
      hackerId: hackerId,
      submissionId: newSubmission[0].id,
      age: existingProfile.age,
      bio: existingProfile.bio,
      education: existingProfile.education,
      isVeteran: existingProfile.isVeteran,
      previousHackathons: existingProfile.previousHackathons,
      shirtSize: existingProfile.shirtSize,
      diet: existingProfile.diet,
      allergies: existingProfile.allergies,
      physicalIssues: existingProfile.physicalIssues,
      shareInfoWithSponsors: existingProfile.shareInfoWithSponsors,
      country: existingProfile.country,
    })
    .returning();

  console.log('Created new hacker profile:', newProfile[0].id);

  console.log('\n✅ Successfully duplicated profile!');
  console.log(`New submission ID: ${newSubmission[0].id}`);
  console.log(`New profile ID: ${newProfile[0].id}`);
  console.log(`Modality: ${newSubmission[0].modality}`);
  console.log(`Status: ${newSubmission[0].status}`);
}

duplicateEvanProfile()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error running script:', error);
    process.exit(1);
  });
