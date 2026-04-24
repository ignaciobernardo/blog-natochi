import { and, eq, inArray } from 'drizzle-orm';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { db } from '@/src/lib/db';
import {
  events,
  hackerProfiles,
  hackers,
  reviews,
  submissions,
} from '@/src/lib/db/schema';

async function exportHackersForApproval() {
  console.log('Starting hacker export...');

  // Query 1: Hackers with onboarding_request or onboarding_complete status
  const onboardingHackers = await db
    .select({
      fullName: hackers.fullName,
      email: hackers.email,
      nationalId: hackerProfiles.nationalId,
      submissionId: submissions.id,
    })
    .from(hackers)
    .innerJoin(hackerProfiles, eq(hackerProfiles.hackerId, hackers.id))
    .innerJoin(submissions, eq(submissions.id, hackerProfiles.submissionId))
    .innerJoin(events, eq(events.id, submissions.eventId))
    .where(
      and(
        eq(events.name, 'Platanus Hack 25'),
        inArray(submissions.status, [
          'onboarding_request',
          'onboarding_complete',
        ]),
      ),
    );

  console.log(
    `Found ${onboardingHackers.length} hackers with onboarding status`,
  );

  // Query 2: Team hackers on waiting list with at least one "yes" review
  // First, get submission IDs that meet the criteria
  const waitingListTeamSubmissionsWithYes = await db
    .select({
      submissionId: reviews.submissionId,
    })
    .from(reviews)
    .innerJoin(submissions, eq(submissions.id, reviews.submissionId))
    .innerJoin(events, eq(events.id, submissions.eventId))
    .where(
      and(
        eq(events.name, 'Platanus Hack 25'),
        eq(submissions.isTeam, true),
        eq(submissions.status, 'waiting_list'),
        eq(reviews.qualification, 'yes'),
      ),
    )
    .groupBy(reviews.submissionId);

  const waitingListSubmissionIds = waitingListTeamSubmissionsWithYes.map(
    (s) => s.submissionId,
  );

  console.log(
    `Found ${waitingListSubmissionIds.length} waiting list team submissions with at least one 'yes' review`,
  );

  let waitingListHackers: typeof onboardingHackers = [];

  if (waitingListSubmissionIds.length > 0) {
    // Get hackers from those submissions
    waitingListHackers = await db
      .select({
        fullName: hackers.fullName,
        email: hackers.email,
        nationalId: hackerProfiles.nationalId,
        submissionId: submissions.id,
      })
      .from(hackers)
      .innerJoin(hackerProfiles, eq(hackerProfiles.hackerId, hackers.id))
      .innerJoin(submissions, eq(submissions.id, hackerProfiles.submissionId))
      .innerJoin(events, eq(events.id, submissions.eventId))
      .where(
        and(
          eq(events.name, 'Platanus Hack 25'),
          inArray(submissions.id, waitingListSubmissionIds),
        ),
      );

    console.log(
      `Found ${waitingListHackers.length} hackers from waiting list teams`,
    );
  }

  // Combine and deduplicate hackers
  const allHackersMap = new Map<
    string,
    { fullName: string; email: string; nationalId: string | null }
  >();

  for (const hacker of [...onboardingHackers, ...waitingListHackers]) {
    const key = `${hacker.fullName}-${hacker.submissionId}`;
    if (!allHackersMap.has(key)) {
      allHackersMap.set(key, {
        fullName: hacker.fullName,
        email: hacker.email,
        nationalId: hacker.nationalId,
      });
    }
  }

  console.log(`Total unique hackers: ${allHackersMap.size}`);

  // Generate CSV
  const csvLines: string[] = [];

  // Add rows
  for (const hacker of allHackersMap.values()) {
    const rut = hacker.nationalId || 'N/A';
    csvLines.push(`${hacker.fullName},${hacker.email},${rut},hacker,TRUE`);
  }

  const csvContent = csvLines.join('\n');

  // Write to file
  const outputPath = join(process.cwd(), 'hackers-export.csv');
  writeFileSync(outputPath, csvContent, 'utf-8');

  console.log(`\nExport complete!`);
  console.log(`File saved to: ${outputPath}`);
  console.log(`Total records: ${csvLines.length}`);
}

exportHackersForApproval()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error running script:', error);
    process.exit(1);
  });
