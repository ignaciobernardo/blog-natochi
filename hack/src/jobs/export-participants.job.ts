import { and, eq, isNotNull } from 'drizzle-orm';
import { COUNTRIES } from '@/src/lib/constants';
import { db } from '@/src/lib/db';
import {
  hackerProfiles,
  hackers,
  projects,
  submissions,
  teams,
  tracks,
} from '@/src/lib/db/schema';
import { getDefaultEvent } from '@/src/queries/events';
import { googleSheetsService } from '@/src/services/google-sheets';

interface ParticipantData {
  fullName: string;
  email: string;
  nationalId: string | null;
  age: number | null;
  education: string | null;
  country: string | null;
  github: string | null;
  linkedin: string | null;
  teamSlug: string | null;
  projectName: string | null;
  projectRepo: string | null;
  trackName: string | null;
  rawVideosUrl: string | null;
  notes: string | null;
  shareInfoWithSponsors: boolean;
}

export async function exportParticipants(): Promise<string> {
  console.log('🚀 Starting participant export for Platanus Hack 25...');

  const defaultEvent = await getDefaultEvent();
  if (!defaultEvent) {
    console.error('❌ No default event found');
    throw new Error('No default event found');
  }

  console.log(`📅 Event: ${defaultEvent.name}`);

  // Get all hacker profiles for the event with onboarding complete
  const participants = await db
    .select({
      hackerId: hackers.id,
      fullName: hackers.fullName,
      email: hackers.email,
      nationalId: hackerProfiles.nationalId,
      age: hackerProfiles.age,
      education: hackerProfiles.education,
      country: hackerProfiles.country,
      github: hackers.github,
      linkedin: hackers.linkedin,
      teamId: hackerProfiles.teamId,
      shareInfoWithSponsors: hackerProfiles.shareInfoWithSponsors,
    })
    .from(hackerProfiles)
    .innerJoin(hackers, eq(hackerProfiles.hackerId, hackers.id))
    .innerJoin(submissions, eq(hackerProfiles.submissionId, submissions.id))
    .where(
      and(
        eq(submissions.eventId, defaultEvent.id),
        isNotNull(hackerProfiles.onboardCompleteAt),
      ),
    );

  console.log(
    `✅ Found ${participants.length} participants who completed onboarding`,
  );

  // Get team upload tracking data
  const teamUploadTracking = await googleSheetsService.getTeamUploadTracking();
  const trackingMap = new Map(
    teamUploadTracking.map((t) => [
      t.teamSlug,
      { rawVideosUrls: t.rawVideosUrls },
    ]),
  );

  console.log(
    `✅ Loaded ${trackingMap.size} team upload records from Google Sheets`,
  );

  // Award notes mapping
  const awardNotes: Record<string, string> = {
    'team-34': 'Equipo Ganador Track Fintech + Seguridad Digital',
    'team-2': 'Ganador Track Human Enhancement',
    'team-24': 'Segundo lugar Track Human Enhancement',
    'team-12': 'Segundo lugar Track Consumer AI',
    'team-6': 'Ganador Platanus Hack 25 y Track Consumer AI',
    'team-22': 'Segundo lugar Track Legacy',
    'team-21': 'Ganador Track Legacy',
  };

  // Get team information (slug, track, project)
  const teamsData = await db
    .select({
      teamId: teams.id,
      teamSlug: teams.slug,
      trackName: tracks.name,
      projectTitle: projects.name,
    })
    .from(teams)
    .leftJoin(tracks, eq(teams.trackId, tracks.id))
    .leftJoin(projects, eq(projects.teamId, teams.id))
    .where(eq(teams.eventId, defaultEvent.id));

  const teamsMap = new Map(
    teamsData.map((t) => [
      t.teamId,
      {
        teamSlug: t.teamSlug,
        trackName: t.trackName,
        projectTitle: t.projectTitle,
      },
    ]),
  );

  console.log(
    `✅ Loaded ${teamsMap.size} teams with their projects and tracks`,
  );

  // Build participant data with all required fields
  const participantData: ParticipantData[] = participants.map((p) => {
    const teamInfo = p.teamId ? teamsMap.get(p.teamId) : null;
    const trackingInfo = teamInfo?.teamSlug
      ? trackingMap.get(teamInfo.teamSlug)
      : null;

    // Use project name from database
    const projectName = teamInfo?.projectTitle || null;

    // Generate project repo URL
    const projectRepo = teamInfo?.teamSlug
      ? `https://github.com/platanus-hack/platanus-hack-25-${teamInfo.teamSlug}`
      : null;

    // Format country with full name and emoji
    const countryInfo = p.country
      ? COUNTRIES.find((c) => c.code === p.country)
      : null;
    const countryDisplay = countryInfo
      ? `${countryInfo.emoji} ${countryInfo.name}`
      : p.country || '';

    // Get award notes for the team
    const notes = teamInfo?.teamSlug
      ? awardNotes[teamInfo.teamSlug] || null
      : null;

    return {
      fullName: p.fullName,
      email: p.shareInfoWithSponsors ? p.email : '',
      nationalId: p.nationalId,
      age: p.shareInfoWithSponsors ? p.age : null,
      education: p.shareInfoWithSponsors ? p.education : null,
      country: countryDisplay,
      github: p.github,
      linkedin: p.linkedin,
      teamSlug: teamInfo?.teamSlug || null,
      projectName,
      projectRepo,
      trackName: teamInfo?.trackName || null,
      rawVideosUrl: trackingInfo?.rawVideosUrls || null,
      notes,
      shareInfoWithSponsors: p.shareInfoWithSponsors,
    };
  });

  // Sort alphabetically by full name
  participantData.sort((a, b) => a.fullName.localeCompare(b.fullName));

  // Generate CSV
  const csvHeader = [
    'Full Name',
    'Email',
    'National ID',
    'Age',
    'Education',
    'Country',
    'GitHub',
    'LinkedIn',
    'Team Slug',
    'Project Name',
    'Project Repo',
    'Track',
    'Raw Videos URL',
    'Notes',
  ];

  const csvRows = participantData.map((p) => [
    p.fullName,
    p.email,
    p.nationalId || '',
    p.age !== null ? p.age.toString() : '',
    p.education || '',
    p.country || '',
    p.github || '',
    p.linkedin || '',
    p.teamSlug || '',
    p.projectName || '',
    p.projectRepo || '',
    p.trackName || '',
    p.rawVideosUrl || '',
    p.notes || '',
  ]);

  const csvContent = [
    csvHeader.join(','),
    ...csvRows.map((row) =>
      row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','),
    ),
  ].join('\n');

  console.log(`✅ Exported ${participantData.length} participants`);
  console.log(
    `📊 Breakdown: ${participantData.filter((p) => p.shareInfoWithSponsors).length} shared email, ${participantData.filter((p) => !p.shareInfoWithSponsors).length} email hidden`,
  );

  return csvContent;
}
