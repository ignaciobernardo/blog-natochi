import { eq, inArray, or } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import { hackerProfiles, hackers, submissions } from '@/src/lib/db/schema';

async function countOnboardingHackers() {
  console.log(
    '🔍 Analyzing hacker profiles and submission onboarding states...\n',
  );

  // Find submissions with status 'onboarding_request' or 'onboarding_complete'
  const onboardingSubmissions = await db
    .select({
      id: submissions.id,
      status: submissions.status,
    })
    .from(submissions)
    .where(
      or(
        eq(submissions.status, 'onboarding_request'),
        eq(submissions.status, 'onboarding_complete'),
      ),
    );

  console.log(
    `📊 Found ${onboardingSubmissions.length} submissions in onboarding states:`,
  );

  const onboardingRequestCount = onboardingSubmissions.filter(
    (s) => s.status === 'onboarding_request',
  ).length;
  const onboardingCompleteCount = onboardingSubmissions.filter(
    (s) => s.status === 'onboarding_complete',
  ).length;

  console.log(`   - onboarding_request: ${onboardingRequestCount} submissions`);
  console.log(
    `   - onboarding_complete: ${onboardingCompleteCount} submissions\n`,
  );

  if (onboardingSubmissions.length === 0) {
    console.log(
      '✅ No hacker profiles to count (no submissions in onboarding states)',
    );
    return;
  }

  // Get submission IDs
  const submissionIds = onboardingSubmissions.map((s) => s.id);

  // Get all hacker profiles with their onboarding completion status
  const profiles = await db
    .select({
      id: hackerProfiles.id,
      submissionId: hackerProfiles.submissionId,
      onboardCompleteAt: hackerProfiles.onboardCompleteAt,
      hackerId: hackerProfiles.hackerId,
      hackerEmail: hackers.email,
      hackerName: hackers.fullName,
    })
    .from(hackerProfiles)
    .innerJoin(hackers, eq(hackerProfiles.hackerId, hackers.id))
    .where(inArray(hackerProfiles.submissionId, submissionIds));

  console.log(`👥 Total hacker profiles: ${profiles.length}\n`);

  // Create a map of submission ID to status
  const submissionStatusMap = new Map(
    onboardingSubmissions.map((s) => [s.id, s.status]),
  );

  // Analyze mismatches
  let hackersCompletedWithRequestStatus = 0;
  let hackersNotCompletedWithCompleteStatus = 0;
  let hackersCompletedWithCompleteStatus = 0;
  let hackersNotCompletedWithRequestStatus = 0;

  const hackersNotCompletedList: typeof profiles = [];
  const hackersCompletedWithRequestList: typeof profiles = [];

  profiles.forEach((profile) => {
    const submissionStatus = submissionStatusMap.get(profile.submissionId);
    const hasCompleted = !!profile.onboardCompleteAt;

    if (hasCompleted && submissionStatus === 'onboarding_request') {
      hackersCompletedWithRequestStatus++;
      hackersCompletedWithRequestList.push(profile);
    } else if (!hasCompleted && submissionStatus === 'onboarding_complete') {
      hackersNotCompletedWithCompleteStatus++;
      hackersNotCompletedList.push(profile);
    } else if (hasCompleted && submissionStatus === 'onboarding_complete') {
      hackersCompletedWithCompleteStatus++;
    } else if (!hasCompleted && submissionStatus === 'onboarding_request') {
      hackersNotCompletedWithRequestStatus++;
    }
  });

  console.log('📈 Breakdown by submission status:');
  console.log(
    `   - Submissions with status "onboarding_request": ${onboardingRequestCount * 1} submissions`,
  );
  console.log(
    `     → Hackers with onboardCompleteAt set: ${hackersCompletedWithRequestStatus}`,
  );
  console.log(
    `     → Hackers without onboardCompleteAt: ${hackersNotCompletedWithRequestStatus}`,
  );
  console.log(
    `   - Submissions with status "onboarding_complete": ${onboardingCompleteCount} submissions`,
  );
  console.log(
    `     → Hackers with onboardCompleteAt set: ${hackersCompletedWithCompleteStatus}`,
  );
  console.log(
    `     → Hackers without onboardCompleteAt: ${hackersNotCompletedWithCompleteStatus}\n`,
  );

  if (
    hackersCompletedWithRequestStatus > 0 ||
    hackersNotCompletedWithCompleteStatus > 0
  ) {
    console.log('⚠️  POTENTIAL MISMATCHES DETECTED:');
    if (hackersCompletedWithRequestStatus > 0) {
      console.log(
        `   - ${hackersCompletedWithRequestStatus} hackers have completed onboarding but their submission is still "onboarding_request"`,
      );
    }
    if (hackersNotCompletedWithCompleteStatus > 0) {
      console.log(
        `   - ${hackersNotCompletedWithCompleteStatus} hackers have NOT completed onboarding but their submission is "onboarding_complete"`,
      );
    }

    // Show details of hackers who haven't completed but submission is complete
    if (hackersNotCompletedList.length > 0) {
      console.log(
        '\n🔍 HACKERS WITH INCOMPLETE ONBOARDING (submission status: onboarding_complete):',
      );
      hackersNotCompletedList.forEach((hacker, idx) => {
        console.log(
          `   ${idx + 1}. ${hacker.hackerName} (${hacker.hackerEmail})`,
        );
        console.log(`      - Hacker ID: ${hacker.hackerId}`);
        console.log(`      - Submission ID: ${hacker.submissionId}`);
        console.log(`      - Profile ID: ${hacker.id}`);
      });
    }

    // Show details of hackers who completed but submission still in request
    if (hackersCompletedWithRequestList.length > 0) {
      console.log(
        '\n🔍 HACKERS WHO COMPLETED (submission status still: onboarding_request):',
      );
      hackersCompletedWithRequestList.forEach((hacker, idx) => {
        console.log(
          `   ${idx + 1}. ${hacker.hackerName} (${hacker.hackerEmail})`,
        );
        console.log(`      - Hacker ID: ${hacker.hackerId}`);
        console.log(`      - Submission ID: ${hacker.submissionId}`);
        console.log(`      - Completed at: ${hacker.onboardCompleteAt}`);
      });
    }
  } else {
    console.log(
      '✅ No mismatches detected - all hackers and submissions are in sync!',
    );
  }

  console.log('\n✅ Done!');
}

countOnboardingHackers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
