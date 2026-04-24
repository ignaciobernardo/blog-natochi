import { eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/lib/db';
import { events } from '@/src/lib/db/schema';

const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');
  const error = request.nextUrl.searchParams.get('error');

  if (error) {
    return NextResponse.redirect(
      `${request.nextUrl.origin}/admin?spotify_error=${encodeURIComponent(error)}`,
    );
  }

  if (!code || !state) {
    return NextResponse.json(
      { error: 'Missing authorization code or state' },
      { status: 400 },
    );
  }

  let eventId: string;
  try {
    const stateData = JSON.parse(state);
    eventId = stateData.eventId;
  } catch {
    // Legacy format: state is just the eventId
    eventId = state;
  }
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const redirectUri =
    process.env.SPOTIFY_REDIRECT_URI ||
    `${request.nextUrl.origin}/api/spotify/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: 'Spotify credentials not configured' },
      { status: 500 },
    );
  }

  try {
    // Exchange authorization code for access token and refresh token
    const tokenResponse = await fetch(SPOTIFY_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('[Spotify OAuth] Token exchange failed:', errorData);
      return NextResponse.redirect(
        `${request.nextUrl.origin}/admin?spotify_error=token_exchange_failed`,
      );
    }

    const tokenData = await tokenResponse.json();
    const refreshToken = tokenData.refresh_token;

    if (!refreshToken) {
      console.error('[Spotify OAuth] No refresh token received');
      return NextResponse.redirect(
        `${request.nextUrl.origin}/admin?spotify_error=no_refresh_token`,
      );
    }

    await db
      .update(events)
      .set({ spotifyRefreshToken: refreshToken })
      .where(eq(events.id, eventId));
    console.log(`[Spotify OAuth] ✅ Refresh token stored for event ${eventId}`);

    // Redirect back to admin with success message
    return NextResponse.redirect(
      `${request.nextUrl.origin}/admin?spotify_success=true`,
    );
  } catch (error) {
    console.error('[Spotify OAuth] Error:', error);
    return NextResponse.redirect(
      `${request.nextUrl.origin}/admin?spotify_error=unknown`,
    );
  }
}
