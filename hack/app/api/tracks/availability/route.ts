import { and, eq, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/src/lib/db';
import { teams } from '@/src/lib/db/schema';
import { getDefaultEvent } from '@/src/queries/events';
import {
  checkAllTeamsSelectedTrack,
  getAllTracks,
  getAllTracksWithTeams,
} from '@/src/queries/tracks';

export interface TrackAvailability {
  id: string;
  name: string;
  description: string | null;
  availableSpots: number | null;
  totalSpots: number | null;
  currentTeams: number;
}

export interface TrackAvailabilityResponse {
  tracks: TrackAvailability[];
  trackSelectionStartTime: string | null;
  trackSelectionStarted: boolean;
  allTeamsSelected?: boolean;
  tracksWithTeams?: Array<{
    id: string;
    name: string;
    description: string | null;
    teams: Array<{
      id: string;
      slug: string;
      members: Array<{
        github: string | null;
      }>;
    }>;
  }>;
}

export async function GET() {
  try {
    const event = await getDefaultEvent();

    if (!event) {
      return NextResponse.json({ error: 'No event found' }, { status: 404 });
    }

    const allTracks = await getAllTracks(event.id);

    const trackAvailability: TrackAvailability[] = await Promise.all(
      allTracks.map(async (track) => {
        const [result] = await db
          .select({
            count: sql<number>`cast(count(*) as int)`,
          })
          .from(teams)
          .where(and(eq(teams.trackId, track.id), eq(teams.eventId, event.id)));

        const currentTeams = result?.count || 0;
        const totalSpots = event.trackTeamLimit;
        const availableSpots =
          totalSpots !== null ? totalSpots - currentTeams : null;

        return {
          id: track.id,
          name: track.name,
          description: track.description,
          availableSpots,
          totalSpots,
          currentTeams,
        };
      }),
    );

    const now = new Date();
    const trackSelectionStarted = event.trackSelectionStartTime
      ? now >= event.trackSelectionStartTime
      : false;

    const allTeamsSelected = await checkAllTeamsSelectedTrack(event.id);
    const tracksWithTeams = allTeamsSelected
      ? await getAllTracksWithTeams(event.id)
      : undefined;

    const response: TrackAvailabilityResponse = {
      tracks: trackAvailability,
      trackSelectionStartTime:
        event.trackSelectionStartTime?.toISOString() || null,
      trackSelectionStarted,
      allTeamsSelected,
      tracksWithTeams,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching track availability:', error);
    return NextResponse.json(
      { error: 'Failed to fetch track availability' },
      { status: 500 },
    );
  }
}
