import { and, eq, isNull } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import { hackerProfiles, hackers, submissions } from '@/src/lib/db/schema';

async function getIncompleteOnboardingEmails() {
  try {
    const results = await db
      .select({
        email: hackers.email,
      })
      .from(submissions)
      .innerJoin(
        hackerProfiles,
        eq(submissions.id, hackerProfiles.submissionId),
      )
      .innerJoin(hackers, eq(hackerProfiles.hackerId, hackers.id))
      .where(
        and(
          eq(submissions.status, 'onboarding_request'),
          isNull(hackerProfiles.onboardCompleteAt),
        ),
      );

    const emails = results.map((r) => r.email);
    const uniqueEmails = [...new Set(emails)];

    console.log(
      '\n=== Hacker Emails (Onboarding Request, Not Completed) ===\n',
    );
    console.log(uniqueEmails.join(', '));
    console.log(`\n\nTotal: ${uniqueEmails.length} unique emails\n`);

    return uniqueEmails;
  } catch (error) {
    console.error('Error fetching emails:', error);
    throw error;
  }
}

getIncompleteOnboardingEmails();
