import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import {
  ensureOnboardingRequested,
  getHackerByPublicId,
  getHackerProfile,
  hasAcceptedSubmission,
} from '@/src/queries/hackers';
import { OnboardWelcome } from './_components/onboard-welcome';

interface OnboardPageProps {
  params: Promise<{
    publicId: string;
  }>;
}

export default async function OnboardPage({ params }: OnboardPageProps) {
  const { publicId } = await params;

  const hacker = await getHackerByPublicId(publicId);

  if (!hacker) {
    redirect('/login');
  }

  const hasAccepted = await hasAcceptedSubmission(hacker.id);

  if (!hasAccepted) {
    redirect(`/hacker/${publicId}/status`);
  }

  await ensureOnboardingRequested(hacker.id);

  const hackerProfile = await getHackerProfile(hacker.id);

  if (hackerProfile?.onboardCompleteAt) {
    redirect('/hacker/dashboard');
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <OnboardWelcome hacker={hacker} />
    </Suspense>
  );
}
