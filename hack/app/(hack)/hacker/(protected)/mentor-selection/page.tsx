import { redirect } from 'next/navigation';
import { onlyHacker } from '@/src/lib/auth/server';
import { getDefaultEvent } from '@/src/queries/events';
import { getHackerDashboardData } from '@/src/queries/hackers';
import {
  checkAllTeamsSelectedMentor,
  getAllMentorsWithTeams,
} from '@/src/queries/mentors';
import { getTeamById } from '@/src/queries/teams';
import MentorSelectionClient from './_components/mentor-selection-client';

export default async function MentorSelectionPage() {
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

  const allTeamsSelected = await checkAllTeamsSelectedMentor(event.id);
  const mentorsWithTeams = allTeamsSelected
    ? await getAllMentorsWithTeams(event.id)
    : null;

  return (
    <MentorSelectionClient
      teamId={team.id}
      currentMentorId={team.mentorId}
      mentorSelectionStartTime={
        event.mentorSelectionStartTime?.toISOString() || null
      }
      allTeamsSelected={allTeamsSelected}
      mentorsWithTeams={mentorsWithTeams}
    />
  );
}
