import { and, eq, inArray, isNotNull } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import {
  hackerProfiles,
  hackers,
  submissions,
  teams,
} from '@/src/lib/db/schema';
import { getDefaultEvent } from '@/src/queries/events';
import { createTeam } from '@/src/queries/teams';

async function createTeamsFromSubmissions() {
  console.log('🚀 Starting team creation from submissions...\n');

  const defaultEvent = await getDefaultEvent();
  if (!defaultEvent) {
    console.error('❌ No default event found');
    return;
  }

  console.log(`📅 Using event: ${defaultEvent.name}\n`);

  // Get all hacker profiles with onboarding completed for submissions with status 'onboarding_request' or 'onboarding_complete'
  const completedProfiles = await db
    .select({
      id: hackerProfiles.id,
      hackerId: hackerProfiles.hackerId,
      submissionId: hackerProfiles.submissionId,
      teamId: hackerProfiles.teamId,
      hackerName: hackers.fullName,
      hackerEmail: hackers.email,
      submissionIsTeam: submissions.isTeam,
      submissionStatus: submissions.status,
    })
    .from(hackerProfiles)
    .innerJoin(hackers, eq(hackerProfiles.hackerId, hackers.id))
    .innerJoin(submissions, eq(hackerProfiles.submissionId, submissions.id))
    .where(
      and(
        eq(submissions.eventId, defaultEvent.id),
        inArray(submissions.status, [
          'onboarding_request',
          'onboarding_complete',
        ]),
        isNotNull(hackerProfiles.onboardCompleteAt),
      ),
    )
    .orderBy(hackerProfiles.submissionId);

  console.log(
    `✅ Found ${completedProfiles.length} hackers with completed onboarding\n`,
  );

  // Group by submission
  const submissionGroups = new Map<string, typeof completedProfiles>();
  for (const profile of completedProfiles) {
    const group = submissionGroups.get(profile.submissionId) || [];
    group.push(profile);
    submissionGroups.set(profile.submissionId, group);
  }

  console.log(`📊 Found ${submissionGroups.size} unique submissions\n`);

  // Get the current highest team number
  const existingTeams = await db
    .select({ slug: teams.slug })
    .from(teams)
    .where(eq(teams.eventId, defaultEvent.id));

  let maxTeamNumber = 0;
  for (const team of existingTeams) {
    const match = team.slug.match(/^team-(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxTeamNumber) {
        maxTeamNumber = num;
      }
    }
  }

  console.log(`🔢 Starting team numbering from: ${maxTeamNumber + 1}\n`);

  let teamsCreated = 0;
  let hackersAssigned = 0;
  let skipped = 0;
  let currentTeamNumber = maxTeamNumber + 1;

  for (const [_submissionId, profiles] of submissionGroups) {
    // Check if any hacker already has a team
    const alreadyInTeam = profiles.some((p) => p.teamId !== null);
    if (alreadyInTeam) {
      console.log(
        `⏭️  Skipping submission - hackers already in teams: ${profiles.map((p) => p.hackerName).join(', ')}`,
      );
      skipped++;
      continue;
    }

    // Get submission status (should be the same for all profiles in a submission)
    const submissionStatus = profiles[0]?.submissionStatus;
    if (!submissionStatus) {
      console.log(
        `⏭️  Skipping submission - no status found: ${profiles.map((p) => p.hackerName).join(', ')}`,
      );
      skipped++;
      continue;
    }

    // Create team with correlative slug
    const teamSlug = `team-${currentTeamNumber}`;
    const isSolo = profiles.length === 1;
    console.log(`\n🔨 Creating ${isSolo ? 'solo' : ''} team: ${teamSlug}`);
    console.log(`   Status: ${submissionStatus}`);
    console.log(
      `   Members (${profiles.length}): ${profiles.map((p) => p.hackerName).join(', ')}`,
    );

    try {
      const team = await createTeam({
        eventId: defaultEvent.id,
        slug: teamSlug,
        formedOnSite: false,
        trackId: null,
        tableNumber: null,
      });

      // Update all hacker profiles with the team ID
      for (const profile of profiles) {
        await db
          .update(hackerProfiles)
          .set({ teamId: team.id })
          .where(eq(hackerProfiles.id, profile.id));

        console.log(`   ✓ Added ${profile.hackerName} to team`);
        hackersAssigned++;
      }

      teamsCreated++;
      currentTeamNumber++;
      console.log(`   ✅ Team created successfully (${team.id})`);
    } catch (error) {
      console.error(`   ❌ Failed to create team:`, error);
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('📈 Summary:');
  console.log(`   Teams created: ${teamsCreated}`);
  console.log(`   Hackers assigned: ${hackersAssigned}`);
  console.log(`   Submissions skipped: ${skipped}`);
  console.log('='.repeat(60));
  console.log('\n✨ Done!');
}

createTeamsFromSubmissions()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
