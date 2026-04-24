import { type NextRequest, NextResponse } from 'next/server';

const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';
const REQUIRED_SCOPES = [
  'user-read-currently-playing',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-playback-position',
].join(' ');

export async function GET(request: NextRequest) {
  const eventId = request.nextUrl.searchParams.get('eventId');

  if (!eventId) {
    return NextResponse.json(
      { error: 'Event ID is required' },
      { status: 400 },
    );
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const redirectUri =
    process.env.SPOTIFY_REDIRECT_URI ||
    `${request.nextUrl.origin}/api/spotify/callback`;

  if (!clientId) {
    return NextResponse.json(
      { error: 'Spotify client ID not configured' },
      { status: 500 },
    );
  }

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: REQUIRED_SCOPES,
    state: eventId, // Use eventId as state for security + passing context
  });

  const authUrl = `${SPOTIFY_AUTH_URL}?${params.toString()}`;

  return NextResponse.redirect(authUrl);
}
