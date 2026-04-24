import { and, eq } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import {
  events,
  hackerProfiles,
  hackers,
  submissions,
} from '@/src/lib/db/schema';

async function replaceHackerSubmission() {
  // Find the Platanus Hack 25 event
  const [event] = await db
    .select()
    .from(events)
    .where(eq(events.name, 'Platanus Hack 25'))
    .limit(1);

  if (!event) {
    throw new Error('Platanus Hack 25 event not found');
  }

  console.log(`Found event: ${event.name} (${event.id})`);

  // Find yerko.contreras@uc.cl hacker
  const [yerkoHacker] = await db
    .select()
    .from(hackers)
    .where(eq(hackers.email, 'yerko.contreras@uc.cl'))
    .limit(1);

  if (!yerkoHacker) {
    throw new Error('Hacker yerko.contreras@uc.cl not found');
  }

  console.log(`Found Yerko: ${yerkoHacker.fullName} (${yerkoHacker.id})`);

  // Find Yerko's hacker profile for this event
  const [yerkoProfile] = await db
    .select({
      id: hackerProfiles.id,
      submissionId: hackerProfiles.submissionId,
    })
    .from(hackerProfiles)
    .innerJoin(submissions, eq(hackerProfiles.submissionId, submissions.id))
    .where(
      and(
        eq(hackerProfiles.hackerId, yerkoHacker.id),
        eq(submissions.eventId, event.id),
      ),
    )
    .limit(1);

  if (!yerkoProfile) {
    throw new Error('Yerko hacker profile for Platanus Hack 25 not found');
  }

  console.log(`Found Yerko's profile: ${yerkoProfile.id}`);
  console.log(`Submission ID: ${yerkoProfile.submissionId}`);

  // Create new hacker
  const [newHacker] = await db
    .insert(hackers)
    .values({
      email: 'juancagp2001@gmail.com',
      fullName: 'Juan Carlos Gil Paredes',
      github: 'Juancagp',
    })
    .returning();

  console.log(`\nCreated new hacker: ${newHacker.fullName} (${newHacker.id})`);
  console.log(`Public ID: ${newHacker.publicId}`);

  // Create new hacker profile linked to the same submission
  const [newProfile] = await db
    .insert(hackerProfiles)
    .values({
      hackerId: newHacker.id,
      submissionId: yerkoProfile.submissionId,
      age: 35,
      shirtSize: 'L',
    })
    .returning();

  console.log(`Created new hacker profile: ${newProfile.id}`);

  // Delete Yerko's profile (unlinking him from the submission)
  await db.delete(hackerProfiles).where(eq(hackerProfiles.id, yerkoProfile.id));

  console.log(`\nDeleted Yerko's profile: ${yerkoProfile.id}`);

  console.log('\n========================================');
  console.log(`New Hacker Public ID: ${newHacker.publicId}`);
  console.log('========================================');
}

replaceHackerSubmission()
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
