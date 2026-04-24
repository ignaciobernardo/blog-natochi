import { eq } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import {
  events,
  hackerProfiles,
  hackers,
  submissions,
} from '@/src/lib/db/schema';

async function main() {
  console.log('🔍 Checking submissions in "onboarding_request" state...\n');

  // Check submissions in onboarding_request state
  const onboardingSubmissions = await db
    .select()
    .from(submissions)
    .where(eq(submissions.status, 'onboarding_request'))
    .limit(10);

  console.log(
    `Found ${onboardingSubmissions.length} onboarding_request submissions:`,
  );
  onboardingSubmissions.forEach((sub, idx) => {
    console.log(
      `  ${idx + 1}. ID: ${sub.id}, Country: ${sub.country}, Cohort: ${sub.cohort}, Modality: ${sub.modality}`,
    );
  });

  console.log('\n---\n');

  // Get Platanus Hack 25 event
  const allEvents = await db.select().from(events);
  const event = allEvents.find((e) => e.name.includes('25'));

  if (!event) {
    console.error('❌ No "Platanus Hack 25" event found in database.');
    console.log('Available events:');
    allEvents.forEach((e) => console.log(`  - ${e.name}`));
    return;
  }

  console.log(`📅 Using event: ${event.name} (ID: ${event.id})\n`);

  // Create or find hacker Rafael Fernández
  console.log('👤 Creating/finding hacker Rafael Fernández...');

  const existingHacker = await db
    .select()
    .from(hackers)
    .where(eq(hackers.email, 'rafael.fedez44@gmail.com'))
    .limit(1);

  let hacker: (typeof existingHacker)[0] | null = null;
  if (existingHacker.length > 0) {
    hacker = existingHacker[0];
    console.log(
      `  ✓ Found existing hacker: ${hacker.fullName} (ID: ${hacker.id})`,
    );
  } else {
    const [newHacker] = await db
      .insert(hackers)
      .values({
        email: 'rafael.fedez44@gmail.com',
        fullName: 'Rafael Fernández',
        github: 'https://github.com/rafafdz',
        linkedin: 'https://www.linkedin.com/in/rafafdzs',
      })
      .returning();

    hacker = newHacker;
    console.log(
      `  ✓ Created new hacker: ${hacker.fullName} (ID: ${hacker.id})`,
    );
  }

  // Create submission
  console.log('\n📝 Creating submission...');

  const [newSubmission] = await db
    .insert(submissions)
    .values({
      eventId: event.id,
      tallySubmissionId: `test-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      rawPayload: {
        fullName: 'Rafael Fernández',
        email: 'rafael.fedez44@gmail.com',
        github: 'https://github.com/rafafdz',
        linkedin: 'https://www.linkedin.com/in/rafafdzs',
      },
      isTeam: false,
      modality: 'team_looking',
      status: 'onboarding_request',
      cohort: 'final',
      country: 'CL',
      source: 'in-house',
    })
    .returning();

  console.log(`  ✓ Created submission: ${newSubmission.id}`);
  console.log(`    Status: ${newSubmission.status}`);
  console.log(`    Modality: ${newSubmission.modality}`);
  console.log(`    Cohort: ${newSubmission.cohort}`);

  // Create hacker profile linked to submission
  console.log('\n👨‍💻 Creating hacker profile...');

  const [profile] = await db
    .insert(hackerProfiles)
    .values({
      hackerId: hacker.id,
      submissionId: newSubmission.id,
      country: 'CL',
    })
    .returning();

  console.log(`  ✓ Created hacker profile: ${profile.id}`);

  console.log('\n✅ All done!');
  console.log(`\nSummary:`);
  console.log(`  Hacker: ${hacker.fullName} (${hacker.email})`);
  console.log(`  GitHub: ${hacker.github}`);
  console.log(`  LinkedIn: ${hacker.linkedin}`);
  console.log(`  Submission ID: ${newSubmission.id}`);
  console.log(`  Status: ${newSubmission.status}`);
  console.log(`  Modality: ${newSubmission.modality}`);
}

main()
  .then(() => {
    console.log('\n🎉 Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
