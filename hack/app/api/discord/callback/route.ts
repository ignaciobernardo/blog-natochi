import { and, desc, eq, inArray } from 'drizzle-orm';
import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { db } from '@/src/lib/db';
import { hackerProfiles, hackers, submissions } from '@/src/lib/db/schema';
import { finishOnboarding } from '@/src/operators/onboarding/finish-onboarding';
import { getDefaultEvent } from '@/src/queries/events';
import { discordService } from '@/src/services/discord';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    console.error('Discord OAuth error:', error);
    return NextResponse.redirect(
      new URL(
        `/hacker/onboarding?error=${encodeURIComponent(error)}`,
        request.url,
      ),
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/hacker/onboarding?error=missing_code', request.url),
    );
  }

  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.linkedId) {
      return NextResponse.redirect(
        new URL('/hacker/onboarding?error=not_authenticated', request.url),
      );
    }

    const defaultEvent = await getDefaultEvent();
    if (!defaultEvent) {
      return NextResponse.redirect(
        new URL('/hacker/onboarding?error=no_active_event', request.url),
      );
    }

    const [result] = await db
      .select({
        hackerProfileId: hackerProfiles.id,
        hackerId: hackerProfiles.hackerId,
        github: hackers.github,
        country: hackerProfiles.country,
      })
      .from(hackerProfiles)
      .innerJoin(hackers, eq(hackerProfiles.hackerId, hackers.id))
      .innerJoin(submissions, eq(hackerProfiles.submissionId, submissions.id))
      .where(
        and(
          eq(hackers.id, session.user.linkedId),
          eq(submissions.eventId, defaultEvent.id),
          inArray(submissions.status, [
            'onboarding_request',
            'onboarding_complete',
          ]),
        ),
      )
      .orderBy(desc(hackerProfiles.createdAt))
      .limit(1);

    if (!result) {
      return NextResponse.redirect(
        new URL('/hacker/onboarding?error=invalid_profile', request.url),
      );
    }

    const githubUsername = result.github?.split('/').pop() || 'Hacker';

    await discordService.connectHacker({
      hackerProfileId: result.hackerProfileId,
      code,
      githubUsername,
      countryCode: result.country || undefined,
    });

    await finishOnboarding.finish({
      hackerProfileId: result.hackerProfileId,
      hackerId: result.hackerId,
    });

    return NextResponse.redirect(new URL('/hacker/onboarding', request.url));
  } catch (error) {
    console.error('Discord callback error:', error);
    return NextResponse.redirect(
      new URL('/hacker/onboarding?error=connection_failed', request.url),
    );
  }
}
