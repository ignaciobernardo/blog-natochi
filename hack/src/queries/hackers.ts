import { and, desc, eq, inArray, isNotNull } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import {
  events,
  type Hacker,
  hackerFeedback,
  hackerNotes,
  hackerProfiles,
  hackers,
  type InsertHacker,
  type InsertHackerFeedback,
  mentors,
  projects,
  type SubmissionModality,
  type SubmissionStatus,
  statusHistory,
  submissions,
  teams,
  tracks,
} from '@/src/lib/db/schema';
import { getDefaultEvent } from './events';

export async function getHackerByGithub(
  githubUrl: string,
): Promise<Hacker | null> {
  const [hacker] = await db
    .select()
    .from(hackers)
    .where(eq(hackers.github, githubUrl))
    .limit(1);

  return hacker || null;
}

export async function createHacker(data: InsertHacker): Promise<Hacker> {
  const [hacker] = await db.insert(hackers).values(data).returning();
  return hacker;
}

export async function updateHacker(
  id: string,
  data: Partial<InsertHacker>,
): Promise<Hacker> {
  const [hacker] = await db
    .update(hackers)
    .set(data)
    .where(eq(hackers.id, id))
    .returning();
  return hacker;
}

interface FindOrCreateResult {
  hacker: Hacker;
  wasUpdated: boolean;
  wasCreated: boolean;
}

export async function findOrCreateHacker(
  hackerData: {
    email: string;
    fullName: string;
    github: string | null;
    linkedin: string | null;
  },
  hackerId: string,
): Promise<FindOrCreateResult> {
  if (!hackerData.github?.trim()) {
    const hacker = await createHacker({
      id: hackerId,
      email: hackerData.email,
      fullName: hackerData.fullName,
      github: null,
      linkedin: hackerData.linkedin || null,
    });
    return { hacker, wasUpdated: false, wasCreated: true };
  }

  const githubUrl = hackerData.github.trim();
  const existingHacker = await getHackerByGithub(githubUrl);

  if (existingHacker) {
    const updates: Partial<InsertHacker> = {};
    let needsUpdate = false;

    if (existingHacker.fullName !== hackerData.fullName) {
      updates.fullName = hackerData.fullName;
      needsUpdate = true;
    }

    if (existingHacker.email !== hackerData.email) {
      updates.email = hackerData.email;
      needsUpdate = true;
    }

    if (
      hackerData.linkedin &&
      existingHacker.linkedin !== hackerData.linkedin
    ) {
      updates.linkedin = hackerData.linkedin;
      needsUpdate = true;
    }

    if (needsUpdate) {
      const updatedHacker = await updateHacker(existingHacker.id, updates);
      return { hacker: updatedHacker, wasUpdated: true, wasCreated: false };
    }

    return { hacker: existingHacker, wasUpdated: false, wasCreated: false };
  }

  const hacker = await createHacker({
    id: hackerId,
    email: hackerData.email,
    fullName: hackerData.fullName,
    github: githubUrl,
    linkedin: hackerData.linkedin || null,
  });

  return { hacker, wasUpdated: false, wasCreated: true };
}

export async function createHackerNote(data: {
  hackerId: string;
  authorAdminId: string;
  body: string;
}) {
  const [note] = await db.insert(hackerNotes).values(data).returning();
  return note;
}

export interface HackerStatusData {
  hacker: Hacker;
  submission: {
    id: string;
    status: SubmissionStatus;
    isTeam: boolean;
    modality: SubmissionModality;
    submittedAt: Date;
  };
  teamMembers: Array<{
    id: string;
    fullName: string;
    github: string | null;
    role: string;
  }>;
}

export async function getHackerStatusByPublicId(
  publicId: string,
): Promise<HackerStatusData | null> {
  const defaultEvent = await getDefaultEvent();
  if (!defaultEvent) {
    return null;
  }

  const [hacker] = await db
    .select()
    .from(hackers)
    .where(eq(hackers.publicId, publicId))
    .limit(1);

  if (!hacker) {
    return null;
  }

  // Get all submissions for this hacker for the event
  const profiles = await db
    .select({
      submissionId: hackerProfiles.submissionId,
      status: submissions.status,
      teamId: hackerProfiles.teamId,
    })
    .from(hackerProfiles)
    .innerJoin(submissions, eq(hackerProfiles.submissionId, submissions.id))
    .where(
      and(
        eq(hackerProfiles.hackerId, hacker.id),
        eq(submissions.eventId, defaultEvent.id),
      ),
    );

  if (profiles.length === 0) {
    return null;
  }

  // Get the most recent status change for each submission
  let selectedProfile = profiles[0];
  if (profiles.length > 1) {
    const statusChanges = await Promise.all(
      profiles.map(async (p) => {
        const [latestChange] = await db
          .select({
            submissionId: statusHistory.submissionId,
            changedAt: statusHistory.changedAt,
          })
          .from(statusHistory)
          .where(eq(statusHistory.submissionId, p.submissionId))
          .orderBy(desc(statusHistory.changedAt))
          .limit(1);
        return latestChange;
      }),
    );

    // Find the submission with the most recent status change
    const mostRecentChange = statusChanges.reduce((prev, current) => {
      if (!prev) return current;
      if (!current) return prev;
      return current.changedAt > prev.changedAt ? current : prev;
    });

    selectedProfile =
      profiles.find((p) => p.submissionId === mostRecentChange?.submissionId) ||
      profiles[0];
  }

  const profile = selectedProfile;

  if (!profile) {
    return null;
  }

  const [submission] = await db
    .select({
      id: submissions.id,
      status: submissions.status,
      isTeam: submissions.isTeam,
      modality: submissions.modality,
      submittedAt: submissions.submittedAt,
    })
    .from(submissions)
    .where(eq(submissions.id, profile.submissionId))
    .limit(1);

  if (!submission) {
    return null;
  }

  let members: Array<{
    id: string;
    fullName: string;
    github: string | null;
    role: string;
  }> = [];

  if (submission.isTeam) {
    members = await db
      .select({
        id: hackers.id,
        fullName: hackers.fullName,
        github: hackers.github,
      })
      .from(hackerProfiles)
      .innerJoin(hackers, eq(hackerProfiles.hackerId, hackers.id))
      .where(eq(hackerProfiles.submissionId, submission.id))
      .then((rows) =>
        rows.map((row) => ({
          id: row.id,
          fullName: row.fullName,
          github: row.github,
          role: row.id === hacker.id ? 'leader' : 'member',
        })),
      );
  } else {
    members = [
      {
        id: hacker.id,
        fullName: hacker.fullName,
        github: hacker.github,
        role: 'solo',
      },
    ];
  }

  members.sort((a, b) => {
    if (a.role === 'leader' && b.role !== 'leader') return -1;
    if (a.role !== 'leader' && b.role === 'leader') return 1;
    return a.fullName.localeCompare(b.fullName);
  });

  return {
    hacker,
    submission,
    teamMembers: members,
  };
}

export async function getHackerById(id: string) {
  const [hacker] = await db
    .select()
    .from(hackers)
    .where(eq(hackers.id, id))
    .limit(1);

  return hacker;
}

export async function getHackerByPublicId(publicId: string) {
  try {
    const [hacker] = await db
      .select()
      .from(hackers)
      .where(eq(hackers.publicId, publicId))
      .limit(1);

    return hacker || null;
  } catch (error) {
    console.error('Error fetching hacker by public ID:', error);
    return null;
  }
}

export async function getHackerProfile(hackerId: string) {
  const profile = await db.query.hackerProfiles.findFirst({
    where: eq(hackerProfiles.hackerId, hackerId),
    orderBy: (hackerProfiles, { desc }) => [desc(hackerProfiles.createdAt)],
  });

  return profile || null;
}

export async function hasAcceptedSubmission(
  hackerId: string,
): Promise<boolean> {
  const defaultEvent = await getDefaultEvent();
  if (!defaultEvent) {
    return false;
  }

  const acceptedSubmissions = await db
    .select({ id: submissions.id })
    .from(hackerProfiles)
    .innerJoin(submissions, eq(hackerProfiles.submissionId, submissions.id))
    .where(
      and(
        eq(hackerProfiles.hackerId, hackerId),
        eq(submissions.eventId, defaultEvent.id),
        inArray(submissions.status, [
          'approved',
          'onboarding_request',
          'onboarding_complete',
        ]),
      ),
    )
    .limit(1);

  return acceptedSubmissions.length > 0;
}

export async function ensureOnboardingRequested(
  hackerId: string,
): Promise<void> {
  const defaultEvent = await getDefaultEvent();
  if (!defaultEvent) {
    return;
  }

  const hackerProfile = await db.query.hackerProfiles.findFirst({
    where: eq(hackerProfiles.hackerId, hackerId),
    orderBy: (hackerProfiles, { desc }) => [desc(hackerProfiles.createdAt)],
  });

  if (!hackerProfile) {
    return;
  }

  const [submission] = await db
    .select()
    .from(submissions)
    .where(
      and(
        eq(submissions.id, hackerProfile.submissionId),
        eq(submissions.eventId, defaultEvent.id),
        eq(submissions.status, 'approved'),
      ),
    )
    .limit(1);

  if (submission) {
    console.log(
      `📝 Transitioning submission ${submission.id} from approved to onboarding_request`,
    );

    await db
      .update(submissions)
      .set({ status: 'onboarding_request' })
      .where(eq(submissions.id, submission.id));

    await db.insert(statusHistory).values({
      submissionId: submission.id,
      fromStatus: 'approved',
      toStatus: 'onboarding_request',
      changedBy: null,
      context: {
        action: 'auto_onboarding_request_on_access',
        triggeredBy: hackerId,
      },
    });

    console.log(
      `✅ Submission ${submission.id} transitioned to onboarding_request`,
    );
  }
}

export interface HackerDashboardData {
  hacker: Hacker;
  hackerProfile: typeof hackerProfiles.$inferSelect | null | undefined;
  team: {
    id: string;
    slug: string;
    tableNumber: string | null;
    track: {
      id: string;
      name: string;
    } | null;
    mentor: {
      id: string;
      fullName: string;
      github: string;
    } | null;
    members: Array<{
      id: string;
      fullName: string;
      github: string | null;
    }>;
  } | null;
}

export async function getHackerDashboardData(
  hackerId: string,
): Promise<HackerDashboardData | null> {
  const defaultEvent = await getDefaultEvent();
  if (!defaultEvent) {
    return null;
  }

  const hacker = await getHackerById(hackerId);
  if (!hacker) {
    return null;
  }

  // Get hacker profile for the default event
  const hackerProfile = await db.query.hackerProfiles.findFirst({
    where: eq(hackerProfiles.hackerId, hacker.id),
    orderBy: (hackerProfiles, { desc }) => [desc(hackerProfiles.createdAt)],
  });

  const [profileWithTeam] = await db
    .select({
      teamId: hackerProfiles.teamId,
    })
    .from(hackerProfiles)
    .innerJoin(submissions, eq(hackerProfiles.submissionId, submissions.id))
    .where(
      and(
        eq(hackerProfiles.hackerId, hackerId),
        eq(submissions.eventId, defaultEvent.id),
        isNotNull(hackerProfiles.teamId),
      ),
    )
    .orderBy(desc(hackerProfiles.createdAt))
    .limit(1);

  let team: HackerDashboardData['team'] = null;

  if (profileWithTeam?.teamId) {
    const [teamData] = await db
      .select({
        id: teams.id,
        slug: teams.slug,
        tableNumber: teams.tableNumber,
        trackId: teams.trackId,
        trackName: tracks.name,
        mentorId: teams.mentorId,
        mentorFullName: mentors.fullName,
        mentorGithub: mentors.github,
      })
      .from(teams)
      .leftJoin(tracks, eq(teams.trackId, tracks.id))
      .leftJoin(mentors, eq(teams.mentorId, mentors.id))
      .where(eq(teams.id, profileWithTeam.teamId))
      .limit(1);

    if (teamData) {
      const teamHackers = await db
        .select({
          id: hackers.id,
          fullName: hackers.fullName,
          github: hackers.github,
        })
        .from(hackerProfiles)
        .innerJoin(hackers, eq(hackerProfiles.hackerId, hackers.id))
        .innerJoin(submissions, eq(hackerProfiles.submissionId, submissions.id))
        .where(
          and(
            eq(hackerProfiles.teamId, teamData.id),
            eq(submissions.eventId, defaultEvent.id),
          ),
        );

      const memberMap = new Map<
        string,
        { id: string; fullName: string; github: string | null }
      >();
      for (const teamHacker of teamHackers) {
        memberMap.set(teamHacker.id, teamHacker);
      }
      const members = Array.from(memberMap.values()).sort((a, b) =>
        a.fullName.localeCompare(b.fullName),
      );

      team = {
        id: teamData.id,
        slug: teamData.slug,
        tableNumber: teamData.tableNumber,
        track:
          teamData.trackId && teamData.trackName
            ? {
                id: teamData.trackId,
                name: teamData.trackName,
              }
            : null,
        mentor:
          teamData.mentorId && teamData.mentorFullName && teamData.mentorGithub
            ? {
                id: teamData.mentorId,
                fullName: teamData.mentorFullName,
                github: teamData.mentorGithub,
              }
            : null,
        members,
      };
    }
  }

  return {
    hacker,
    hackerProfile,
    team,
  };
}

export async function markOnboardingComplete(
  hackerProfileId: string,
): Promise<void> {
  await db
    .update(hackerProfiles)
    .set({
      onboardCompleteAt: new Date(),
    })
    .where(eq(hackerProfiles.id, hackerProfileId));
}

export async function getHackerProfileForFeedback(
  publicId: string,
  eventId: string,
) {
  const [hacker] = await db
    .select()
    .from(hackers)
    .where(eq(hackers.publicId, publicId))
    .limit(1);

  if (!hacker) {
    return null;
  }

  const [profile] = await db
    .select({
      id: hackerProfiles.id,
      hackerId: hackerProfiles.hackerId,
      submissionId: hackerProfiles.submissionId,
      teamId: hackerProfiles.teamId,
    })
    .from(hackerProfiles)
    .innerJoin(submissions, eq(hackerProfiles.submissionId, submissions.id))
    .where(
      and(
        eq(hackerProfiles.hackerId, hacker.id),
        eq(submissions.eventId, eventId),
        inArray(submissions.status, [
          'approved',
          'onboarding_request',
          'onboarding_complete',
        ]),
      ),
    )
    .orderBy(desc(hackerProfiles.createdAt))
    .limit(1);

  if (!profile) {
    return null;
  }

  // Get mentor and team info if the profile has a team assigned
  const [teamData] = profile.teamId
    ? await db
        .select({
          teamId: teams.id,
          teamSlug: teams.slug,
          mentorId: teams.mentorId,
          mentorName: mentors.fullName,
          projectName: projects.name,
        })
        .from(teams)
        .leftJoin(mentors, eq(teams.mentorId, mentors.id))
        .leftJoin(projects, eq(projects.teamId, teams.id))
        .where(and(eq(teams.id, profile.teamId), eq(teams.eventId, eventId)))
        .limit(1)
    : [null];

  return {
    hacker,
    hackerProfile: profile,
    team: teamData
      ? {
          id: teamData.teamId,
          slug: teamData.teamSlug,
        }
      : null,
    project: teamData?.projectName
      ? {
          name: teamData.projectName,
        }
      : null,
    mentor: teamData?.mentorId
      ? {
          id: teamData.mentorId,
          name: teamData.mentorName,
        }
      : null,
  };
}

export async function hasSubmittedFeedback(
  hackerProfileId: string,
  eventId: string,
): Promise<boolean> {
  const [existing] = await db
    .select({ id: hackerFeedback.id })
    .from(hackerFeedback)
    .where(
      and(
        eq(hackerFeedback.hackerProfileId, hackerProfileId),
        eq(hackerFeedback.eventId, eventId),
      ),
    )
    .limit(1);

  return !!existing;
}

export async function createHackerFeedback(
  data: InsertHackerFeedback,
): Promise<typeof hackerFeedback.$inferSelect> {
  const [feedback] = await db.insert(hackerFeedback).values(data).returning();
  return feedback;
}

export async function getHackerFeedbackNotificationData(
  hackerProfileId: string,
  eventId: string,
) {
  const [profileData] = await db
    .select({
      hackerId: hackerProfiles.hackerId,
      hackerName: hackers.fullName,
      hackerEmail: hackers.email,
      hackerGithub: hackers.github,
      teamId: hackerProfiles.teamId,
    })
    .from(hackerProfiles)
    .innerJoin(hackers, eq(hackerProfiles.hackerId, hackers.id))
    .where(eq(hackerProfiles.id, hackerProfileId))
    .limit(1);

  if (!profileData) {
    return null;
  }

  const [eventData] = await db
    .select({
      domain: events.domain,
    })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  const [teamData] = profileData.teamId
    ? await db
        .select({
          teamSlug: teams.slug,
          mentorName: mentors.fullName,
          projectName: projects.name,
          projectSlug: projects.slug,
        })
        .from(teams)
        .leftJoin(mentors, eq(teams.mentorId, mentors.id))
        .leftJoin(projects, eq(projects.teamId, teams.id))
        .where(
          and(eq(teams.id, profileData.teamId), eq(teams.eventId, eventId)),
        )
        .limit(1)
    : [null];

  return {
    hackerName: profileData.hackerName,
    hackerEmail: profileData.hackerEmail,
    hackerGithub: profileData.hackerGithub ?? null,
    teamSlug: teamData?.teamSlug || null,
    mentorName: teamData?.mentorName || null,
    projectName: teamData?.projectName || null,
    projectSlug: teamData?.projectSlug || null,
    eventDomain: eventData?.domain || null,
  };
}
