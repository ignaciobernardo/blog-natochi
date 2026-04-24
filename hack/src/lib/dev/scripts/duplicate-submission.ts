import { eq, sql } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import { hackerProfiles, submissions } from '@/src/lib/db/schema';

const ORIGINAL_SUBMISSION_ID = '1c2c1a4e-46c0-477b-aa1e-fbf15cf21b85';
const EXCLUDE_HACKER_NAME = 'Gonzalo Saravia';

async function duplicateSubmission() {
  console.log('Starting submission duplication...');

  // Get original submission data using SQL
  const [originalSubmission] = await db
    .select()
    .from(submissions)
    .where(eq(submissions.id, ORIGINAL_SUBMISSION_ID));

  if (!originalSubmission) {
    throw new Error('Original submission not found');
  }

  console.log(`Found original submission: ${originalSubmission.id}`);
  console.log(`Original status: ${originalSubmission.status}`);

  // Get hacker profiles with hacker info using MCP postgres
  const profilesResult = await db.execute<{
    profile_id: string;
    hacker_id: string;
    full_name: string;
    age: number | null;
    bio: string | null;
    education: string | null;
    is_veteran: boolean;
    previous_hackathons: string | null;
    shirt_size: string | null;
    diet: string | null;
    allergies: string | null;
    physical_issues: string | null;
    share_info_with_sponsors: boolean;
    country: string | null;
  }>(sql`
    SELECT
      hp.id as profile_id,
      hp.hacker_id,
      h.full_name,
      hp.age,
      hp.bio,
      hp.education,
      hp.is_veteran,
      hp.previous_hackathons,
      hp.shirt_size,
      hp.diet,
      hp.allergies,
      hp.physical_issues,
      hp.share_info_with_sponsors,
      hp.country
    FROM hacker_profiles hp
    JOIN hackers h ON h.id = hp.hacker_id
    WHERE hp.submission_id = ${ORIGINAL_SUBMISSION_ID}
  `);

  const profiles = Array.isArray(profilesResult)
    ? profilesResult
    : profilesResult.rows || [];

  console.log(`Number of hackers: ${profiles.length}`);

  // Filter out Gonzalo Saravia
  const filteredProfiles = profiles.filter(
    (profile) => profile.full_name !== EXCLUDE_HACKER_NAME,
  );

  console.log(
    `After filtering: ${filteredProfiles.length} hackers (excluded ${EXCLUDE_HACKER_NAME})`,
  );

  // Modify raw_payload to update team_size
  const newRawPayload = {
    ...originalSubmission.rawPayload,
    team_size: String(filteredProfiles.length),
    // Clear hacker4 fields since we're removing the 4th member
    hacker4_full_name: '',
    hacker4_country: '',
    hacker4_github: '',
    hacker4_email: '',
    hacker4_linkedin: '',
    hacker4_age: '',
    hacker4_cool: '',
    hacker4_education: '',
    hacker4_veteran: '',
    hacker4_hackathons: '',
    hacker4_shirt_size: '',
    hacker4_diet: '',
    hacker4_allergies: '',
    hacker4_physical_issues: '',
    hacker4_share_info: '',
    'hacker4_share_info (quiero compartir la info de contacto de hacker4 con los sponsors principales del evento)':
      '',
  };

  // Create new submission with status 'received'
  const [newSubmission] = await db
    .insert(submissions)
    .values({
      eventId: originalSubmission.eventId,
      teamId: null,
      tallySubmissionId: `${originalSubmission.tallySubmissionId}-DUP-${Date.now()}`,
      rawPayload: newRawPayload,
      isTeam: originalSubmission.isTeam,
      modality: originalSubmission.modality,
      status: 'received',
      cohort: originalSubmission.cohort,
      country: originalSubmission.country,
      source: 'in-house',
    })
    .returning();

  console.log(`Created new submission: ${newSubmission.id}`);
  console.log(`New submission status: ${newSubmission.status}`);

  // Create new hacker profiles for the filtered hackers
  for (const originalProfile of filteredProfiles) {
    // Create new hacker profile (referencing existing hacker)
    const [newProfile] = await db
      .insert(hackerProfiles)
      .values({
        hackerId: originalProfile.hacker_id,
        submissionId: newSubmission.id,
        age: originalProfile.age,
        bio: originalProfile.bio,
        education: originalProfile.education,
        isVeteran: originalProfile.is_veteran,
        previousHackathons: originalProfile.previous_hackathons,
        shirtSize: originalProfile.shirt_size,
        diet: originalProfile.diet,
        allergies: originalProfile.allergies,
        physicalIssues: originalProfile.physical_issues,
        shareInfoWithSponsors: originalProfile.share_info_with_sponsors,
        country: originalProfile.country,
      })
      .returning();

    console.log(
      `Created profile for ${originalProfile.full_name} (profile id: ${newProfile.id})`,
    );
  }

  console.log('\nDuplication complete!');
  console.log(`New submission ID: ${newSubmission.id}`);
  console.log(`Status: ${newSubmission.status}`);
  console.log(`Hackers included: ${filteredProfiles.length}`);
  console.log(
    `Hackers: ${filteredProfiles.map((p) => p.full_name).join(', ')}`,
  );
}

duplicateSubmission()
  .then(() => {
    console.log('\nScript finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
