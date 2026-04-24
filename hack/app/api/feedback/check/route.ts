import { NextResponse } from 'next/server';
import { getDefaultEvent } from '@/src/queries/events';
import {
  getHackerProfileForFeedback,
  hasSubmittedFeedback,
} from '@/src/queries/hackers';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const publicId = searchParams.get('publicId');

    if (!publicId) {
      return NextResponse.json(
        { error: 'Missing publicId parameter' },
        { status: 400 },
      );
    }

    const event = await getDefaultEvent();
    if (!event) {
      return NextResponse.json(
        { error: 'No se encontró el evento' },
        { status: 404 },
      );
    }

    const data = await getHackerProfileForFeedback(publicId, event.id);
    if (!data) {
      return NextResponse.json(
        {
          error: 'No participaste en Platanus Hack 25 o el enlace es inválido',
        },
        { status: 404 },
      );
    }

    const alreadySubmitted = await hasSubmittedFeedback(
      data.hackerProfile.id,
      event.id,
    );

    return NextResponse.json({
      hackerProfileId: data.hackerProfile.id,
      eventId: event.id,
      hackerName: data.hacker.fullName,
      hackerGithub: data.hacker.github ?? null,
      teamSlug: data.team?.slug ?? null,
      alreadySubmitted,
      mentor: data.mentor,
      projectName: data.project?.name ?? null,
      feedbackPrizeDeadline: event.feedbackPrizeDeadline,
    });
  } catch (error) {
    console.error('Error checking feedback status:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
