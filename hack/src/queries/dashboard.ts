import { and, count, eq, inArray, sql } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import {
  events,
  hackerProfiles,
  hackers,
  type ReviewQualification,
  reviewQualifications,
  reviews,
  type SubmissionStatus,
  statusHistory,
  submissions,
} from '@/src/lib/db/schema';

export interface DashboardStats {
  totalApplicants: number;
  soloParticipants: number;
  teamParticipants: number;
  teamLookingParticipants: number;
  newApplicantsPercent: number;
  newApplicantsCount: number;
  womenPercent: number;
  womenCount: number;
  statusBreakdown: Array<{
    status: SubmissionStatus;
    count: number;
  }>;
}

export async function getDashboardStats(
  eventId: string,
): Promise<DashboardStats> {
  // Count actual people from hacker profiles

  const [{ soloParticipants }] = await db
    .select({
      soloParticipants: count(),
    })
    .from(hackerProfiles)
    .innerJoin(submissions, eq(hackerProfiles.submissionId, submissions.id))
    .where(
      and(eq(submissions.eventId, eventId), eq(submissions.modality, 'solo')),
    );

  const [{ teamParticipants }] = await db
    .select({
      teamParticipants: count(),
    })
    .from(hackerProfiles)
    .innerJoin(submissions, eq(hackerProfiles.submissionId, submissions.id))
    .where(
      and(eq(submissions.eventId, eventId), eq(submissions.modality, 'team')),
    );

  const [{ teamLookingParticipants }] = await db
    .select({
      teamLookingParticipants: count(),
    })
    .from(hackerProfiles)
    .innerJoin(submissions, eq(hackerProfiles.submissionId, submissions.id))
    .where(
      and(
        eq(submissions.eventId, eventId),
        eq(submissions.modality, 'team_looking'),
      ),
    );

  const [{ totalApplicants }] = await db
    .select({
      totalApplicants: sql<number>`CAST(COUNT(DISTINCT ${hackers.id}) AS integer)`,
    })
    .from(hackers)
    .innerJoin(hackerProfiles, eq(hackers.id, hackerProfiles.hackerId))
    .innerJoin(submissions, eq(hackerProfiles.submissionId, submissions.id))
    .where(eq(submissions.eventId, eventId));

  // Calculate women percentage
  const [{ womenCount }] = await db
    .select({
      womenCount: sql<number>`CAST(COUNT(DISTINCT ${hackers.id}) AS integer)`,
    })
    .from(hackers)
    .innerJoin(hackerProfiles, eq(hackers.id, hackerProfiles.hackerId))
    .innerJoin(submissions, eq(hackerProfiles.submissionId, submissions.id))
    .where(and(eq(submissions.eventId, eventId), eq(hackers.gender, 'female')));

  const womenPercent =
    totalApplicants > 0 ? Math.round((womenCount / totalApplicants) * 100) : 0;

  // Calculate new applicants percentage (not from Hack 24)
  let newApplicantsPercent = 0;
  let newApplicantsCount = totalApplicants;

  if (totalApplicants > 0) {
    // Get Hack 24 event ID
    const hack24Event = await db
      .select({ id: events.id })
      .from(events)
      .where(eq(events.name, 'Platanus Hack 24'))
      .limit(1);

    if (hack24Event.length > 0) {
      // Get all hacker IDs from current event
      const currentEventHackers = await db
        .selectDistinct({ id: hackers.id })
        .from(hackers)
        .innerJoin(hackerProfiles, eq(hackers.id, hackerProfiles.hackerId))
        .innerJoin(submissions, eq(hackerProfiles.submissionId, submissions.id))
        .where(eq(submissions.eventId, eventId));

      const currentHackerIds = currentEventHackers.map((h) => h.id);

      if (currentHackerIds.length > 0) {
        // Count hackers from current event who have profiles in Hack 24
        const [{ hack24Count }] = await db
          .select({
            hack24Count: sql<number>`CAST(COUNT(DISTINCT ${hackerProfiles.hackerId}) AS integer)`,
          })
          .from(hackerProfiles)
          .innerJoin(
            submissions,
            eq(hackerProfiles.submissionId, submissions.id),
          )
          .where(
            and(
              inArray(hackerProfiles.hackerId, currentHackerIds),
              eq(submissions.eventId, hack24Event[0].id),
            ),
          );

        newApplicantsCount = totalApplicants - hack24Count;
        newApplicantsPercent = Math.round(
          (newApplicantsCount / totalApplicants) * 100,
        );
      }
    }
  }

  // Status breakdown - count submissions by their status
  const statusBreakdown = await db
    .select({
      status: submissions.status,
      count: sql<number>`cast(count(${submissions.id}) as integer)`,
    })
    .from(submissions)
    .where(eq(submissions.eventId, eventId))
    .groupBy(submissions.status);

  return {
    totalApplicants,
    soloParticipants,
    teamParticipants,
    teamLookingParticipants,
    newApplicantsPercent,
    newApplicantsCount,
    womenPercent,
    womenCount,
    statusBreakdown: statusBreakdown.map((item) => ({
      status: item.status,
      count: item.count,
    })),
  };
}

export interface SubmissionTimelineData {
  date: string;
  solo: number;
  team: number;
  teamLooking: number;
}

export interface SubmissionTimeline {
  currentEvent: {
    eventId: string;
    eventName: string;
    data: SubmissionTimelineData[];
  };
  previousEvents: Array<{
    eventId: string;
    eventName: string;
    data: SubmissionTimelineData[];
  }>;
}

async function getEventTimelineData(
  eventId: string,
): Promise<SubmissionTimelineData[]> {
  // Get all submission dates for this event
  const dates = await db
    .select({
      date: sql<string>`DATE(${submissions.submittedAt})`,
    })
    .from(submissions)
    .where(eq(submissions.eventId, eventId))
    .groupBy(sql`DATE(${submissions.submittedAt})`)
    .orderBy(sql`DATE(${submissions.submittedAt})`);

  const timelineData: SubmissionTimelineData[] = [];

  for (const { date } of dates) {
    // Count cumulative solo submissions submitted on or before this date
    const [{ solo }] = await db
      .select({
        solo: count(),
      })
      .from(submissions)
      .where(
        and(
          eq(submissions.eventId, eventId),
          eq(submissions.modality, 'solo'),
          sql`DATE(${submissions.submittedAt}) <= ${date}`,
        ),
      );

    // Count cumulative team submissions submitted on or before this date
    const [{ team }] = await db
      .select({
        team: count(),
      })
      .from(submissions)
      .where(
        and(
          eq(submissions.eventId, eventId),
          eq(submissions.modality, 'team'),
          sql`DATE(${submissions.submittedAt}) <= ${date}`,
        ),
      );

    // Count cumulative team_looking submissions submitted on or before this date
    const [{ teamLooking }] = await db
      .select({
        teamLooking: count(),
      })
      .from(submissions)
      .where(
        and(
          eq(submissions.eventId, eventId),
          eq(submissions.modality, 'team_looking'),
          sql`DATE(${submissions.submittedAt}) <= ${date}`,
        ),
      );

    timelineData.push({
      date,
      solo,
      team,
      teamLooking,
    });
  }

  return timelineData;
}

export async function getSubmissionTimeline(
  eventId: string,
): Promise<SubmissionTimeline> {
  // Get current event info
  const [currentEvent] = await db
    .select({
      id: sql<string>`${eventId}`,
      name: sql<string>`(SELECT name FROM events WHERE id = ${eventId})`,
    })
    .from(sql`(SELECT 1) as dummy`);

  // Get current event timeline data
  const currentEventData = await getEventTimelineData(eventId);

  // Get all other event IDs
  const otherEvents = await db
    .select({
      eventId: submissions.eventId,
      eventName: sql<string>`(SELECT name FROM events WHERE id = ${submissions.eventId})`,
    })
    .from(submissions)
    .where(sql`${submissions.eventId} != ${eventId}`)
    .groupBy(
      sql`${submissions.eventId}, (SELECT name FROM events WHERE id = ${submissions.eventId})`,
    );

  // Get timeline data for each previous event
  const previousEvents = await Promise.all(
    otherEvents.map(async (event) => ({
      eventId: event.eventId,
      eventName: event.eventName,
      data: await getEventTimelineData(event.eventId),
    })),
  );

  return {
    currentEvent: {
      eventId: currentEvent.id,
      eventName: currentEvent.name,
      data: currentEventData,
    },
    previousEvents,
  };
}

export interface CountryParticipantStats {
  country: string;
  participants: number;
}

export async function getCountryParticipantStats(
  eventId: string,
  limit = 10,
): Promise<CountryParticipantStats[]> {
  const result = await db
    .select({
      country: hackerProfiles.country,
      participants: sql<number>`CAST(COUNT(${hackerProfiles.id}) AS integer)`,
    })
    .from(hackerProfiles)
    .innerJoin(hackers, eq(hackerProfiles.hackerId, hackers.id))
    .innerJoin(submissions, eq(hackerProfiles.submissionId, submissions.id))
    .where(
      and(
        eq(submissions.eventId, eventId),
        sql`${hackerProfiles.country} IS NOT NULL AND ${hackerProfiles.country} != ''`,
      ),
    )
    .groupBy(hackerProfiles.country)
    .orderBy(sql`COUNT(${hackerProfiles.id}) DESC`)
    .limit(limit);

  return result.map((row) => ({
    country: row.country || '',
    participants: row.participants || 0,
  }));
}

export interface ApprovedHackersStats {
  totalApproved: number;
  totalApprovedHackers: number;
  approvedSolo: number;
  approvedTeam: number;
  approvedTeamHackers: number;
  approvedTeamLooking: number;
  womenApproved: number;
  womenPercent: number;
  acceptanceRate: number;
  capacityHackers: number | null;
  countryBreakdown: Array<{
    country: string;
    count: number;
  }>;
  ageDistribution: Array<{
    ageRange: string;
    count: number;
  }>;
}

export async function getApprovedHackersStats(
  eventId: string,
): Promise<ApprovedHackersStats> {
  const statusHistoryTable = sql`${statusHistory}`;

  const approvedSubmissionIds = await db
    .select({
      submissionId: sql<string>`DISTINCT ${statusHistory.submissionId}`,
    })
    .from(statusHistory)
    .innerJoin(submissions, eq(statusHistory.submissionId, submissions.id))
    .where(
      and(
        eq(submissions.eventId, eventId),
        eq(statusHistory.toStatus, 'approved'),
        sql`NOT EXISTS (
          SELECT 1 FROM ${statusHistoryTable} sh2
          WHERE sh2.submission_id = ${statusHistory.submissionId}
          AND sh2.to_status = 'withdrawn'
          AND sh2.changed_at > ${statusHistory.changedAt}
        )`,
      ),
    );

  const approvedIds = approvedSubmissionIds.map((s) => s.submissionId);

  const [event] = await db
    .select({
      capacityHackers: events.capacityHackers,
    })
    .from(events)
    .where(eq(events.id, eventId));

  if (approvedIds.length === 0) {
    return {
      totalApproved: 0,
      totalApprovedHackers: 0,
      approvedSolo: 0,
      approvedTeam: 0,
      approvedTeamHackers: 0,
      approvedTeamLooking: 0,
      womenApproved: 0,
      womenPercent: 0,
      acceptanceRate: 0,
      capacityHackers: event?.capacityHackers || null,
      countryBreakdown: [],
      ageDistribution: [],
    };
  }

  const approvedSubmissions = await db
    .select()
    .from(submissions)
    .where(
      and(
        eq(submissions.eventId, eventId),
        inArray(submissions.id, approvedIds),
      ),
    );

  const approvedSubmissionIdsForEvent = approvedSubmissions.map((s) => s.id);

  if (approvedSubmissionIdsForEvent.length === 0) {
    return {
      totalApproved: 0,
      totalApprovedHackers: 0,
      approvedSolo: 0,
      approvedTeam: 0,
      approvedTeamHackers: 0,
      approvedTeamLooking: 0,
      womenApproved: 0,
      womenPercent: 0,
      acceptanceRate: 0,
      capacityHackers: event?.capacityHackers || null,
      countryBreakdown: [],
      ageDistribution: [],
    };
  }

  const totalApproved = approvedSubmissions.length;

  const approvedSolo = approvedSubmissions.filter(
    (s) => s.modality === 'solo',
  ).length;
  const approvedTeam = approvedSubmissions.filter(
    (s) => s.modality === 'team',
  ).length;
  const approvedTeamLooking = approvedSubmissions.filter(
    (s) => s.modality === 'team_looking',
  ).length;

  const teamSubmissionIds = approvedSubmissions
    .filter((s) => s.modality === 'team')
    .map((s) => s.id);

  const [{ approvedTeamHackers }] =
    teamSubmissionIds.length > 0
      ? await db
          .select({
            approvedTeamHackers: sql<number>`CAST(COUNT(DISTINCT ${hackerProfiles.hackerId}) AS integer)`,
          })
          .from(hackerProfiles)
          .where(inArray(hackerProfiles.submissionId, teamSubmissionIds))
      : [{ approvedTeamHackers: 0 }];

  const [{ totalApprovedHackers }] = await db
    .select({
      totalApprovedHackers: sql<number>`CAST(COUNT(DISTINCT ${hackers.id}) AS integer)`,
    })
    .from(hackers)
    .innerJoin(hackerProfiles, eq(hackers.id, hackerProfiles.hackerId))
    .where(inArray(hackerProfiles.submissionId, approvedSubmissionIdsForEvent));

  const [{ womenApproved }] = await db
    .select({
      womenApproved: sql<number>`CAST(COUNT(DISTINCT ${hackers.id}) AS integer)`,
    })
    .from(hackers)
    .innerJoin(hackerProfiles, eq(hackers.id, hackerProfiles.hackerId))
    .where(
      and(
        inArray(hackerProfiles.submissionId, approvedSubmissionIdsForEvent),
        eq(hackers.gender, 'female'),
      ),
    );

  const womenPercent =
    totalApprovedHackers > 0
      ? Math.round((womenApproved / totalApprovedHackers) * 100)
      : 0;

  const acceptanceRate =
    event?.capacityHackers && event.capacityHackers > 0
      ? Math.round((totalApprovedHackers / event.capacityHackers) * 100)
      : 0;

  const ageData = await db
    .select({
      age: hackerProfiles.age,
    })
    .from(hackerProfiles)
    .where(
      and(
        inArray(hackerProfiles.submissionId, approvedSubmissionIdsForEvent),
        sql`${hackerProfiles.age} IS NOT NULL`,
      ),
    );

  const ageDistribution = [
    { ageRange: '<18', count: 0 },
    { ageRange: '18-20', count: 0 },
    { ageRange: '21-23', count: 0 },
    { ageRange: '24-26', count: 0 },
    { ageRange: '27-30', count: 0 },
    { ageRange: '31+', count: 0 },
  ];

  for (const { age } of ageData) {
    if (age === null) continue;
    if (age < 18) ageDistribution[0].count++;
    else if (age <= 20) ageDistribution[1].count++;
    else if (age <= 23) ageDistribution[2].count++;
    else if (age <= 26) ageDistribution[3].count++;
    else if (age <= 30) ageDistribution[4].count++;
    else ageDistribution[5].count++;
  }

  const countryBreakdown = await db
    .select({
      country: hackerProfiles.country,
      count: sql<number>`CAST(COUNT(DISTINCT ${hackerProfiles.hackerId}) AS integer)`,
    })
    .from(hackerProfiles)
    .where(
      and(
        inArray(hackerProfiles.submissionId, approvedSubmissionIdsForEvent),
        sql`${hackerProfiles.country} IS NOT NULL AND ${hackerProfiles.country} != ''`,
      ),
    )
    .groupBy(hackerProfiles.country)
    .orderBy(sql`COUNT(DISTINCT ${hackerProfiles.hackerId}) DESC`)
    .limit(10);

  return {
    totalApproved,
    totalApprovedHackers,
    approvedSolo,
    approvedTeam,
    approvedTeamHackers,
    approvedTeamLooking,
    womenApproved,
    womenPercent,
    acceptanceRate,
    capacityHackers: event?.capacityHackers || null,
    countryBreakdown: countryBreakdown.map((c) => ({
      country: c.country || '',
      count: c.count,
    })),
    ageDistribution,
  };
}

export interface ReviewDistributionByHacker {
  qualification: ReviewQualification | 'no_review';
  count: number;
}

export async function getReviewDistributionByHacker(
  eventId: string,
): Promise<ReviewDistributionByHacker[]> {
  const allSubmissions = await db
    .select({
      id: submissions.id,
    })
    .from(submissions)
    .where(eq(submissions.eventId, eventId));

  const submissionIds = allSubmissions.map((s) => s.id);

  if (submissionIds.length === 0) {
    return [];
  }

  const submissionReviews = await db
    .select({
      submissionId: reviews.submissionId,
      qualification: reviews.qualification,
    })
    .from(reviews)
    .where(inArray(reviews.submissionId, submissionIds));

  const reviewsBySubmission = new Map<string, ReviewQualification[]>();
  for (const review of submissionReviews) {
    if (!reviewsBySubmission.has(review.submissionId)) {
      reviewsBySubmission.set(review.submissionId, []);
    }
    reviewsBySubmission.get(review.submissionId)?.push(review.qualification);
  }

  const lowestReviewBySubmission = new Map<
    string,
    ReviewQualification | 'no_review'
  >();

  for (const submissionId of submissionIds) {
    const reviewsForSubmission = reviewsBySubmission.get(submissionId);
    if (!reviewsForSubmission || reviewsForSubmission.length === 0) {
      lowestReviewBySubmission.set(submissionId, 'no_review');
    } else {
      const qualificationScores: Record<ReviewQualification, number> = {
        hell_no: 0,
        no: 1,
        maybe: 2,
        yes: 3,
        hell_yes: 4,
      };
      const lowestReview = reviewsForSubmission.reduce((lowest, current) =>
        qualificationScores[current] < qualificationScores[lowest]
          ? current
          : lowest,
      );
      lowestReviewBySubmission.set(submissionId, lowestReview);
    }
  }

  const hackersByReview = new Map<
    ReviewQualification | 'no_review',
    Set<string>
  >();

  for (const [submissionId, review] of lowestReviewBySubmission.entries()) {
    if (!hackersByReview.has(review)) {
      hackersByReview.set(review, new Set());
    }

    const hackersInSubmission = await db
      .select({
        hackerId: hackerProfiles.hackerId,
      })
      .from(hackerProfiles)
      .where(eq(hackerProfiles.submissionId, submissionId));

    for (const hacker of hackersInSubmission) {
      hackersByReview.get(review)?.add(hacker.hackerId);
    }
  }

  const distribution: ReviewDistributionByHacker[] = [
    ...reviewQualifications.map((qual) => ({
      qualification: qual as ReviewQualification,
      count: hackersByReview.get(qual)?.size || 0,
    })),
    {
      qualification: 'no_review' as const,
      count: hackersByReview.get('no_review')?.size || 0,
    },
  ];

  return distribution;
}

export interface StatusBreakdownByModality {
  status: SubmissionStatus;
  soloCount: number;
  teamLookingCount: number;
  teamCount: number;
  teamHackersCount: number;
}

export async function getStatusBreakdownByModality(
  eventId: string,
): Promise<StatusBreakdownByModality[]> {
  // Get all submissions for this event grouped by status and modality
  const statusCounts = await db
    .select({
      status: submissions.status,
      modality: submissions.modality,
      count: sql<number>`CAST(COUNT(*) AS integer)`,
    })
    .from(submissions)
    .where(eq(submissions.eventId, eventId))
    .groupBy(submissions.status, submissions.modality);

  // Get team submissions to count total hackers
  const teamSubmissions = await db
    .select({
      id: submissions.id,
      status: submissions.status,
    })
    .from(submissions)
    .where(
      and(eq(submissions.eventId, eventId), eq(submissions.modality, 'team')),
    );

  // Count hackers for each team submission status
  const hackerCountsByStatus = new Map<SubmissionStatus, number>();

  for (const teamSubmission of teamSubmissions) {
    const [{ hackerCount }] = await db
      .select({
        hackerCount: sql<number>`CAST(COUNT(*) AS integer)`,
      })
      .from(hackerProfiles)
      .where(eq(hackerProfiles.submissionId, teamSubmission.id));

    const currentCount = hackerCountsByStatus.get(teamSubmission.status) || 0;
    hackerCountsByStatus.set(teamSubmission.status, currentCount + hackerCount);
  }

  // Group counts by status
  const statusMap = new Map<
    SubmissionStatus,
    {
      soloCount: number;
      teamLookingCount: number;
      teamCount: number;
      teamHackersCount: number;
    }
  >();

  for (const row of statusCounts) {
    if (!statusMap.has(row.status)) {
      statusMap.set(row.status, {
        soloCount: 0,
        teamLookingCount: 0,
        teamCount: 0,
        teamHackersCount: 0,
      });
    }

    const entry = statusMap.get(row.status);
    if (!entry) continue;

    if (row.modality === 'solo') {
      entry.soloCount = row.count;
    } else if (row.modality === 'team_looking') {
      entry.teamLookingCount = row.count;
    } else if (row.modality === 'team') {
      entry.teamCount = row.count;
      entry.teamHackersCount = hackerCountsByStatus.get(row.status) || 0;
    }
  }

  // Convert to array, filtering out statuses with 0 submissions
  const result: StatusBreakdownByModality[] = [];

  for (const [status, counts] of statusMap.entries()) {
    const total = counts.soloCount + counts.teamLookingCount + counts.teamCount;
    if (total > 0) {
      result.push({
        status,
        ...counts,
      });
    }
  }

  // Sort by a custom order - approved first, then onboarding, then withdrawn/rejected at end
  const statusOrder: Record<SubmissionStatus, number> = {
    approved: 1,
    onboarding_complete: 2,
    onboarding_request: 3,
    onboarding_expired: 4,
    asking_self_finance_trip: 5,
    received: 6,
    priority_waiting: 7,
    waiting_list: 8,
    rejected: 9,
    withdrawn: 10,
    archived: 11,
  };

  result.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);

  return result;
}
