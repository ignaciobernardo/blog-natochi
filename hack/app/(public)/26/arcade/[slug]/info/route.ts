import { NextResponse } from 'next/server';
import { getArcadeSubmissionWindowState } from '@/src/lib/utils/arcade';
import { getArcadeChallengeBySlug } from '@/src/queries/arcade-games';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const challenge = await getArcadeChallengeBySlug(slug);

  if (!challenge) {
    return NextResponse.json(
      { error: 'Arcade challenge not found' },
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
      submissionDeadline: challenge.submissionDeadline.toISOString(),
      votingDeadline: challenge.votingDeadline.toISOString(),
    },
    now: now.toISOString(),
    windows: windowState,
  });
}
