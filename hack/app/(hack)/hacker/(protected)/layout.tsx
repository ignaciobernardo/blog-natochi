import { and, desc, eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { ImpersonationBanner } from '@/app/admin/(protected)/_components/impersonation-banner';
import { auth } from '@/src/lib/auth';
import { onlyAuthenticated } from '@/src/lib/auth/server';
import { db } from '@/src/lib/db';
import { hackerProfiles, submissions } from '@/src/lib/db/schema';
import { getDefaultEvent } from '@/src/queries/events';
import { getHackerById } from '@/src/queries/hackers';
import { HackerSidebar } from './_components/hacker-sidebar';

export default async function HackerProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await onlyAuthenticated();
  const fullSession = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session.user.linkedId) {
    redirect('/login?error=no_hacker_linked');
  }

  const hacker = await getHackerById(session.user.linkedId);

  if (!hacker) {
    redirect('/login?error=hacker_not_found');
  }

  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '';
  const isOnboarding = pathname.includes('/onboarding');

  if (!isOnboarding) {
    const defaultEvent = await getDefaultEvent();

    if (defaultEvent) {
      const [hackerProfile] = await db
        .select({
          onboardCompleteAt: hackerProfiles.onboardCompleteAt,
        })
        .from(hackerProfiles)
        .innerJoin(submissions, eq(hackerProfiles.submissionId, submissions.id))
        .where(
          and(
            eq(hackerProfiles.hackerId, hacker.id),
            eq(submissions.eventId, defaultEvent.id),
          ),
        )
        .orderBy(desc(hackerProfiles.createdAt))
        .limit(1);

      if (!hackerProfile?.onboardCompleteAt) {
        redirect('/hacker/onboarding');
      }
    }
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <ImpersonationBanner
        impersonatedBy={fullSession?.session.impersonatedBy || null}
        userName={session.user.name}
        userEmail={session.user.email}
      />
      <div className="flex flex-1 overflow-hidden">
        {!isOnboarding && (
          <div className="hidden w-64 md:block">
            <HackerSidebar user={session.user} hacker={hacker} />
          </div>
        )}
        <main className="flex-1 overflow-y-auto bg-background">{children}</main>
      </div>
    </div>
  );
}
