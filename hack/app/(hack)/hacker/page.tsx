import { and, eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { onlyAuthenticated } from '@/src/lib/auth/server';
import { db } from '@/src/lib/db';
import { hackerProfiles, submissions } from '@/src/lib/db/schema';
import { getDefaultEvent } from '@/src/queries/events';
import { getHackerById } from '@/src/queries/hackers';

export default async function HackerPage() {
  const session = await onlyAuthenticated();

  if (!session.user.linkedId) {
    redirect('/login?error=no_hacker_linked');
  }

  const hacker = await getHackerById(session.user.linkedId);

  if (!hacker) {
    redirect('/login?error=hacker_not_found');
  }

  const defaultEvent = await getDefaultEvent();

  // Check if there's an onboarding_request profile for the current event
  if (defaultEvent) {
    const [onboardingProfile] = await db
      .select({
        onboardCompleteAt: hackerProfiles.onboardCompleteAt,
      })
      .from(hackerProfiles)
      .innerJoin(submissions, eq(hackerProfiles.submissionId, submissions.id))
      .where(
        and(
          eq(hackerProfiles.hackerId, hacker.id),
          eq(submissions.eventId, defaultEvent.id),
          eq(submissions.status, 'onboarding_request'),
        ),
      )
      .limit(1);

    // If there's an incomplete onboarding profile, redirect to onboarding
    if (onboardingProfile && !onboardingProfile.onboardCompleteAt) {
      redirect('/hacker/onboarding');
    }
  }

  redirect('/hacker/dashboard');
}
