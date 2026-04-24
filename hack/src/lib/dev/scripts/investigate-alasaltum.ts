import { eq, sql } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import {
  events,
  hackerProfiles,
  hackers,
  submissions,
  user,
} from '@/src/lib/db/schema';

async function investigateAlasAltum() {
  const githubUrl = 'https://github.com/AlasAltum';

  console.log('=== Investigating GitHub user: AlasAltum ===\n');

  // Find hacker by GitHub URL (case-insensitive)
  const hackerRecords = await db
    .select()
    .from(hackers)
    .where(sql`LOWER(${hackers.github}) = LOWER(${githubUrl})`);

  console.log('1. HACKER RECORD:');
  if (hackerRecords.length === 0) {
    console.log('   ❌ No hacker found with this GitHub URL');
    return;
  }

  const hacker = hackerRecords[0];
  console.log(`   ✓ Found hacker: ${hacker.fullName}`);
  console.log(`   - Email: ${hacker.email}`);
  console.log(`   - GitHub: ${hacker.github}`);
  console.log(`   - ID: ${hacker.id}\n`);

  // Get all submissions for this hacker
  console.log('2. SUBMISSIONS:');
  const profiles = await db
    .select({
      profileId: hackerProfiles.id,
      submissionId: submissions.id,
      submissionStatus: submissions.status,
      eventId: submissions.eventId,
      eventName: events.name,
      cohort: submissions.cohort,
    })
    .from(hackerProfiles)
    .innerJoin(submissions, eq(hackerProfiles.submissionId, submissions.id))
    .innerJoin(events, eq(submissions.eventId, events.id))
    .where(eq(hackerProfiles.hackerId, hacker.id));

  if (profiles.length === 0) {
    console.log('   ❌ No submissions found for this hacker\n');
  } else {
    for (const profile of profiles) {
      console.log(`   - Event: ${profile.eventName}`);
      console.log(`     Status: ${profile.submissionStatus}`);
      console.log(`     Cohort: ${profile.cohort}`);
      console.log(`     Event ID: ${profile.eventId}\n`);
    }
  }

  // Check default event
  console.log('3. DEFAULT EVENT (most recent):');
  const defaultEvents = await db
    .select()
    .from(events)
    .orderBy(sql`created_at DESC`)
    .limit(1);

  if (defaultEvents.length > 0) {
    const defaultEvent = defaultEvents[0];
    console.log(`   - Name: ${defaultEvent.name}`);
    console.log(`   - ID: ${defaultEvent.id}\n`);

    // Check if hacker has submission for default event
    const submissionForDefaultEvent = profiles.find(
      (p) => p.eventId === defaultEvent.id,
    );

    console.log('4. DEFAULT EVENT SUBMISSION CHECK:');
    if (!submissionForDefaultEvent) {
      console.log(
        `   ❌ ISSUE: Hacker has NO submission for the default event (${defaultEvent.name})`,
      );
      console.log('   This is why login fails!\n');

      // Show which events they DO have submissions for
      if (profiles.length > 0) {
        console.log('   Hacker has submissions for:');
        for (const profile of profiles) {
          console.log(
            `   - ${profile.eventName} (${profile.submissionStatus})`,
          );
        }
      }
    } else {
      console.log(
        `   ✓ Has submission for default event: ${submissionForDefaultEvent.submissionStatus}`,
      );

      // Check if any submission is approved
      const hasApprovedSubmission = [
        'approved',
        'onboarding_request',
        'onboarding_complete',
      ].includes(submissionForDefaultEvent.submissionStatus);

      if (!hasApprovedSubmission) {
        console.log(
          `   ❌ ISSUE: Submission status "${submissionForDefaultEvent.submissionStatus}" is not approved`,
        );
        console.log('   This is why login fails!\n');
      } else {
        console.log('   ✓ Submission is approved - login should work\n');
      }
    }
  }

  // Check if user account exists
  console.log('5. USER ACCOUNT:');
  const userAccounts = await db
    .select()
    .from(user)
    .where(eq(user.linkedId, hacker.id));

  if (userAccounts.length === 0) {
    console.log('   - No user account exists yet (expected for first login)\n');
  } else {
    console.log(`   ✓ User account exists: ${userAccounts[0].email}\n`);
  }

  console.log('=== SUMMARY ===');
  console.log('Authentication flow checks:');
  console.log(
    `1. Hacker exists in database: ${hackerRecords.length > 0 ? '✓' : '❌'}`,
  );
  console.log(`2. Has submissions: ${profiles.length > 0 ? '✓' : '❌'}`);

  if (defaultEvents.length > 0) {
    const submissionForDefaultEvent = profiles.find(
      (p) => p.eventId === defaultEvents[0].id,
    );
    console.log(
      `3. Has submission for default event: ${submissionForDefaultEvent ? '✓' : '❌'}`,
    );

    if (submissionForDefaultEvent) {
      const hasApprovedSubmission = [
        'approved',
        'onboarding_request',
        'onboarding_complete',
      ].includes(submissionForDefaultEvent.submissionStatus);
      console.log(
        `4. Submission is approved: ${hasApprovedSubmission ? '✓' : '❌'}`,
      );
    }
  }
}

investigateAlasAltum()
  .then(() => {
    console.log('\n✓ Investigation complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
