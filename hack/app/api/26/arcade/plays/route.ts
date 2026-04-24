import { type NextRequest, NextResponse } from 'next/server';
import {
  getArcadeGamePlayCount,
  recordArcadeGamePlay,
  resolveArcadeGameForChallenge,
} from '@/src/queries/arcade-games';

type RecordPlayRequest = {
  gameId?: string;
};

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const [ipAddress] = forwardedFor.split(',');
    if (ipAddress?.trim()) {
      return ipAddress.trim();
    }
  }

  const fallbackHeaders = ['x-real-ip', 'cf-connecting-ip'];

  for (const headerName of fallbackHeaders) {
    const value = request.headers.get(headerName)?.trim();
    if (value) {
      return value;
    }
  }

  return '127.0.0.1';
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RecordPlayRequest;
    const gameId = body.gameId?.trim();

    if (!gameId) {
      return NextResponse.json(
        { success: false, error: 'Missing gameId.' },
        { status: 400 },
      );
    }

    const resolution = await resolveArcadeGameForChallenge(gameId);

    if (!resolution) {
      return NextResponse.json(
        { success: false, error: 'Arcade game not found.' },
        { status: 404 },
      );
    }

    const ipAddress = getClientIp(request);
    const recordedPlay = await recordArcadeGamePlay(
      resolution.game.id,
      ipAddress,
    );
    const playCount = await getArcadeGamePlayCount(resolution.game.id);

    return NextResponse.json({
      success: true,
      deduped: !recordedPlay,
      playCount,
    });
  } catch (error) {
    console.error('Arcade play tracking error:', error);

    return NextResponse.json(
      { success: false, error: 'Could not record arcade play.' },
      { status: 500 },
    );
  }
}
