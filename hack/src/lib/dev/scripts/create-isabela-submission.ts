import { and, eq } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import { hackerProfiles, hackers, submissions } from '@/src/lib/db/schema';

async function createIsabelaSubmission() {
  try {
    const hackerId = '9d77df25-4c8b-425b-a6a0-2501a8108569';
    const eventId = 'c1d62fec-80e9-412f-8930-a8738d2c7a16';

    const oldSubmissionId = '30599f63-7240-49eb-be29-ebc15d12d6e9';
    const sourceSubmissionId = '5f62f336-eaba-4d0c-8163-b69518e12c3f';

    console.log('🗑️  Deleting old submission...');
    await db.delete(submissions).where(eq(submissions.id, oldSubmissionId));
    console.log('✅ Old submission deleted');

    const hackerData = await db
      .select()
      .from(hackers)
      .where(eq(hackers.id, hackerId))
      .limit(1);

    if (hackerData.length === 0) {
      throw new Error('Hacker not found');
    }

    const hacker = hackerData[0];

    const sourceProfiles = await db
      .select()
      .from(hackerProfiles)
      .where(
        and(
          eq(hackerProfiles.submissionId, sourceSubmissionId),
          eq(hackerProfiles.hackerId, hackerId),
        ),
      )
      .limit(1);

    if (sourceProfiles.length === 0) {
      throw new Error('No profile found for Isabela in source submission');
    }

    const profile = sourceProfiles[0];

    const timestamp = new Date()
      .toISOString()
      .replace('T', ' ')
      .substring(0, 19);
    const tallyId = `ISA${Date.now().toString().slice(-6)}`;

    const rawPayload = {
      'Submission ID': tallyId,
      'Respondent ID': `R${Date.now().toString().slice(-7)}`,
      'Submitted at': timestamp,
      'modalidad?': 'solo',
      solo_full_name: hacker.fullName,
      solo_country: '🇨🇴 Colombia',
      solo_github: hacker.github || '',
      solo_email: hacker.email,
      solo_linkedin: hacker.linkedin || '',
      solo_age: profile.age?.toString() || '',
      solo_cool: profile.bio || '',
      solo_edu: profile.education || '',
      solo_veteran: profile.isVeteran ? 'TRUE' : '',
      solo_hackathons: profile.previousHackathons || '',
      solo_shirt_size: profile.shirtSize || '',
      solo_diet: profile.diet || '',
      solo_allergies: profile.allergies || '',
      solo_physical_issues: profile.physicalIssues || '',
      solo_share_info: profile.shareInfoWithSponsors
        ? 'quiero compartir mi info de contacto con los sponsors principales del evento'
        : '',
      'solo_share_info (quiero compartir mi info de contacto con los sponsors principales del evento)':
        profile.shareInfoWithSponsors ? 'TRUE' : '',
      'ya tienes equipo formado?': 'no',
      team_solo_full_name: '',
      team_solo_country: '',
      team_solo_github: '',
      team_solo_email: '',
      team_solo_linkedin: '',
      team_solo_age: '',
      team_solo_cool: '',
      team_solo_education: '',
      team_solo_veteran: '',
      team_solo_hackathons: '',
      team_solo_shirt_size: '',
      team_solo_diet: '',
      team_solo_allergies: '',
      team_solo_physical_issues: '',
      team_solo_share_info: '',
      'team_solo_share_info (quiero compartir mi info de contacto con los sponsors principales del evento)':
        '',
      team_size: '',
      'qué te gustaría ver en el evento?':
        'Más créditos de API y mentores disponibles',
    };

    const [newSubmission] = await db
      .insert(submissions)
      .values({
        eventId,
        tallySubmissionId: tallyId,
        rawPayload,
        isTeam: false,
        modality: 'solo',
        status: 'received',
        cohort: 'final',
        country: 'CO',
        source: 'in-house',
      })
      .returning();

    console.log('✅ Created new submission:', newSubmission.id);

    const [newProfile] = await db
      .insert(hackerProfiles)
      .values({
        hackerId,
        submissionId: newSubmission.id,
        age: profile.age,
        bio: profile.bio,
        education: profile.education,
        isVeteran: profile.isVeteran,
        previousHackathons: profile.previousHackathons,
        shirtSize: profile.shirtSize,
        diet: profile.diet,
        allergies: profile.allergies,
        physicalIssues: profile.physicalIssues,
        shareInfoWithSponsors: profile.shareInfoWithSponsors,
        country: profile.country,
      })
      .returning();

    console.log('✅ Created new hacker profile:', newProfile.id);
    console.log('\nSubmission Details:');
    console.log('- Submission ID:', newSubmission.id);
    console.log('- Status:', newSubmission.status);
    console.log('- Event ID:', newSubmission.eventId);
    console.log('- Tally Submission ID:', newSubmission.tallySubmissionId);
    console.log('\nProfile Details:');
    console.log('- Profile ID:', newProfile.id);
    console.log('- Hacker ID:', newProfile.hackerId);
    console.log('- Age:', newProfile.age);
    console.log('- Country:', newProfile.country);
    console.log('- Is Veteran:', newProfile.isVeteran);

    return { submission: newSubmission, profile: newProfile };
  } catch (error) {
    console.error('❌ Error creating submission:', error);
    throw error;
  }
}

createIsabelaSubmission()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
