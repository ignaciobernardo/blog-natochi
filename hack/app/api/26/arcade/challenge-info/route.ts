import { NextResponse } from 'next/server';
import { getArcadeSubmissionWindowState } from '@/src/lib/utils/arcade';
import {
  getArcadeChallengeWithEventByEventSlug,
  getCurrentOrLatestArcadeChallengeWithEvent,
} from '@/src/queries/arcade-games';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const eventSlug = searchParams.get('eventSlug')?.trim();
  const challenge = eventSlug
    ? await getArcadeChallengeWithEventByEventSlug(eventSlug)
    : await getCurrentOrLatestArcadeChallengeWithEvent();

  if (!challenge) {
    return NextResponse.json(
      {
        error: eventSlug
          ? `Arcade challenge not found for event "${eventSlug}"`
          : 'Arcade challenge not found',
      },
      { status: 404 },
    );
  }

  const now = new Date();
  const windowState = getArcadeSubmissionWindowState(challenge, now);

  return NextResponse.json({
    challenge: {
      id: challenge.id,
      slug: challenge.slug,
      name: challenge.name,
      eventName: challenge.event.name,
      eventPriorityDeadlineAt:
        challenge.event.priorityDeadlineAt?.toISOString() ?? null,
      eventFinalDeadlineAt:
        challenge.event.finalDeadlineAt?.toISOString() ?? null,
      submissionDeadline: challenge.submissionDeadline.toISOString(),
      votingDeadline: challenge.votingDeadline.toISOString(),
    },
    now: now.toISOString(),
    windows: windowState,
  });
}
