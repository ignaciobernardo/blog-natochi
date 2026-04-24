import { and, eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { onlyAuthenticated } from '@/src/lib/auth/server';
import { db } from '@/src/lib/db';
import { hackerProfiles, submissions } from '@/src/lib/db/schema';
import { finishOnboarding } from '@/src/operators/onboarding/finish-onboarding';
import {
  ensureOnboardingRequested,
  getHackerById,
} from '@/src/queries/hackers';
import { discordService } from '@/src/services/discord';
import { DiscordConnectStep } from './_components/discord-connect-step';
import { OnboardingComplete } from './_components/onboarding-complete';
import { WelcomeAndTerms } from './_components/welcome-and-terms';
import { AdditionalInfoForm } from './additional-info/_components/additional-info-form';
import { AnthropicCreditsForm } from './anthropic-credits/_components/anthropic-credits-form';

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Read searchParams to force dynamic rendering and skip Next.js cache
  await searchParams;

  const session = await onlyAuthenticated();

  if (!session.user.linkedId) {
    redirect('/login?error=no_hacker_linked');
  }

  const hacker = await getHackerById(session.user.linkedId);

  if (!hacker) {
    redirect('/login?error=hacker_not_found');
  }

  await ensureOnboardingRequested(hacker.id);

  // Get the profile for the submission with onboarding_request status
  const [onboardingProfile] = await db
    .select()
    .from(hackerProfiles)
    .innerJoin(submissions, eq(hackerProfiles.submissionId, submissions.id))
    .where(
      and(
        eq(hackerProfiles.hackerId, hacker.id),
        eq(submissions.status, 'onboarding_request'),
      ),
    )
    .limit(1);

  if (!onboardingProfile) {
    redirect('/login?error=no_onboarding_profile');
  }

  const profile = onboardingProfile.hacker_profiles;

  console.log('Onboarding - Hacker Profile:', {
    id: profile.id,
    termsAcceptedAt: profile.termsAcceptedAt,
    discordId: profile.discordId,
    anthropicAccountEmail: profile.anthropicAccountEmail,
  });

  // Step 0: GitHub Welcome & Terms Acceptance (handled with React state)
  if (!profile.termsAcceptedAt) {
    console.log('Showing welcome and terms step - termsAcceptedAt is null');
    return <WelcomeAndTerms hacker={hacker} user={session.user} />;
  }

  // Step 1: Additional info and emergency contact
  if (
    !profile.nationalId ||
    !profile.shoeSize ||
    !profile.emergencyContactName ||
    !profile.emergencyContactPhone
  ) {
    return <AdditionalInfoForm />;
  }

  // Step 2: Anthropic Credits
  if (!profile.anthropicAccountEmail) {
    return <AnthropicCreditsForm />;
  }

  // Step 3: Discord connection
  if (!profile.discordId) {
    const discordOAuthUrl = discordService.getOAuthUrl();
    return <DiscordConnectStep discordOAuthUrl={discordOAuthUrl} />;
  }

  // All onboarding complete - mark as complete if not already marked
  if (!profile.onboardCompleteAt) {
    await finishOnboarding.finish({
      hackerProfileId: profile.id,
      hackerId: hacker.id,
    });
  }

  return <OnboardingComplete hacker={hacker} />;
}
