import { redirect } from 'next/navigation';
import { onlyHacker } from '@/src/lib/auth/server';
import { getDefaultEvent } from '@/src/queries/events';
import { getHackerDashboardData } from '@/src/queries/hackers';
import { getTeamById } from '@/src/queries/teams';
import {
  checkAllTeamsSelectedTrack,
  getAllTracksWithTeams,
} from '@/src/queries/tracks';
import TrackSelectionClient from './_components/track-selection-client';

export default async function TrackSelectionPage() {
  const currentUser = await onlyHacker();
  const event = await getDefaultEvent();

  if (!event) {
    redirect('/login?error=no_event');
  }

  if (!currentUser.linkedId) {
    redirect('/login?error=no_hacker_linked');
  }

  const dashboardData = await getHackerDashboardData(currentUser.linkedId);

  if (!dashboardData?.team) {
    redirect('/login?error=no_team');
  }

  const team = await getTeamById(dashboardData.team.id);

  if (!team) {
    redirect('/login?error=team_not_found');
  }

  const allTeamsSelected = await checkAllTeamsSelectedTrack(event.id);
  const tracksWithTeams = allTeamsSelected
    ? await getAllTracksWithTeams(event.id)
    : null;

  return (
    <TrackSelectionClient
      teamId={team.id}
      currentTrackId={team.trackId}
      trackSelectionStartTime={
        event.trackSelectionStartTime?.toISOString() || null
      }
      allTeamsSelected={allTeamsSelected}
      tracksWithTeams={tracksWithTeams}
    />
  );
}
