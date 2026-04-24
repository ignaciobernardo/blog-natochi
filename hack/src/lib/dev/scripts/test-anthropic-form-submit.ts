import { eq } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import { hackerProfiles, hackers } from '@/src/lib/db/schema';
import { anthropicFormSubmitter } from '@/src/operators/anthropic/form-submitter';

async function testAnthropicFormSubmit() {
  console.log('Finding Diego Pollack profile...\n');

  // Find Diego Pollack specifically
  const hacker = await db.query.hackers.findFirst({
    where: eq(hackers.fullName, 'Diego Pollack'),
  });

  if (!hacker) {
    console.error('Diego Pollack not found');
    return;
  }

  const profile = await db.query.hackerProfiles.findFirst({
    where: eq(hackerProfiles.hackerId, hacker.id),
  });

  if (!profile) {
    console.error('No hacker profile found for Diego Pollack');
    return;
  }

  console.log('Found profile:');
  console.log(`  Hacker: ${hacker.fullName}`);
  console.log(`  Email: ${hacker.email}`);
  console.log(`  LinkedIn: ${hacker.linkedin}`);
  console.log(`  Anthropic Email: ${profile.anthropicAccountEmail}`);
  console.log(`  Anthropic Org ID: ${profile.anthropicOrgId}`);
  console.log(
    `  Anthropic Products: ${(profile.anthropicUsedProducts as string[])?.join(', ')}`,
  );
  console.log(`  Anthropic Updates: ${profile.anthropicUpdates}`);
  console.log(`  Already Sent At: ${profile.anthropicInfoSentAt || 'Never'}`);
  console.log('\nSubmitting to Google Form...\n');

  const result = await anthropicFormSubmitter.submit({
    hackerProfileId: profile.id,
  });

  if (result.success) {
    console.log('✅ Form submission successful!');

    const updatedProfile = await db.query.hackerProfiles.findFirst({
      where: eq(hackerProfiles.id, profile.id),
    });
    console.log(
      `  anthropicInfoSentAt: ${updatedProfile?.anthropicInfoSentAt}`,
    );
  } else {
    console.error('❌ Form submission failed:', result.error);
  }
}

testAnthropicFormSubmit()
  .then(() => {
    console.log('\nScript finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
