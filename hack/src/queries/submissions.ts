import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  ilike,
  inArray,
  ne,
  or,
  sql,
} from 'drizzle-orm';
import { db } from '@/src/lib/db';
import {
  admins,
  type Cohort,
  events,
  flightRequests,
  hackerNotes,
  hackerProfiles,
  hackers,
  type InsertFlightRequest,
  type InsertSubmission,
  outboundEmails,
  type ReviewQualification,
  reviews,
  type Submission,
  type SubmissionModality,
  type SubmissionStatus,
  statusHistory,
  submissionNotes,
  submissions,
} from '@/src/lib/db/schema';

export async function getSubmissionByTallyId(
  tallySubmissionId: string,
): Promise<Submission | null> {
  const [submission] = await db
    .select()
    .from(submissions)
    .where(eq(submissions.tallySubmissionId, tallySubmissionId))
    .limit(1);

  return submission || null;
}

export async function createSubmission(
  data: InsertSubmission,
): Promise<Submission> {
  const [submission] = await db.insert(submissions).values(data).returning();
  return submission;
}

export async function getSubmissionByTeamId(
  teamId: string,
): Promise<Submission | null> {
  const [submission] = await db
    .select()
    .from(submissions)
    .where(eq(submissions.teamId, teamId))
    .limit(1);

  return submission || null;
}

export interface GetSubmissionsForReviewParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: SubmissionStatus[];
  cohort?: Cohort[];
  modality?: SubmissionModality[];
  qualification?: ReviewQualification[];
  country?: string;
  submittedAfter?: Date;
  submittedBefore?: Date;
  sortBy?: 'submittedAt';
  sortOrder?: 'asc' | 'desc';
  eventId?: string;
  hasFlightRequest?: boolean;
  hasReview?: boolean;
  hasWomen?: boolean;
}

export interface SubmissionWithMembers {
  submission: Submission;
  members: Array<{
    id: string;
    fullName: string;
    email: string;
    github: string | null;
    linkedin: string | null;
    gender: 'male' | 'female' | null;
    profile: {
      age: number | null;
      bio: string | null;
      education: string | null;
      isVeteran: boolean;
      previousHackathons: string | null;
      shirtSize: string | null;
      diet: string | null;
      allergies: string | null;
      physicalIssues: string | null;
      country: string | null;
    } | null;
  }>;
  hasFlightRequest: boolean;
  reviews: Array<{
    id: string;
    qualification: ReviewQualification;
    reviewerId: string;
    createdAt: Date;
  }>;
}

export async function getSubmissionsForReview(
  params: GetSubmissionsForReviewParams = {},
) {
  const {
    page = 1,
    limit = 20,
    search,
    status,
    cohort,
    modality,
    qualification,
    country,
    submittedAfter,
    submittedBefore,
    sortOrder = 'desc',
    eventId,
    hasFlightRequest,
    hasReview,
    hasWomen,
  } = params;

  const offset = (page - 1) * limit;

  // First, get submission IDs that match our search criteria if search is provided
  let submissionIdsToFilter: string[] | undefined;

  if (search) {
    const searchPattern = `%${search}%`;

    // Find hackers matching the search (name, email, github)
    const matchingHackers = await db
      .select({ id: hackers.id })
      .from(hackers)
      .where(
        or(
          ilike(hackers.email, searchPattern),
          ilike(hackers.fullName, searchPattern),
          ilike(hackers.github, searchPattern),
        ),
      );

    const hackerIds = matchingHackers.map((h) => h.id);

    // Also search in JSON payload using PostgreSQL's text search
    const matchingSubmissions = await db
      .select({ id: submissions.id })
      .from(submissions)
      .where(
        sql`CAST(${submissions.rawPayload} AS TEXT) ILIKE ${searchPattern}`,
      );

    const submissionIdsFromPayload = matchingSubmissions.map((s) => s.id);

    // Find submissions for these hackers
    const submissionsForHackers =
      hackerIds.length > 0
        ? await db
            .select({ submissionId: hackerProfiles.submissionId })
            .from(hackerProfiles)
            .where(inArray(hackerProfiles.hackerId, hackerIds))
        : [];

    const submissionIdsFromHackers = submissionsForHackers.map(
      (s) => s.submissionId,
    );

    // Combine submission IDs from both searches
    const allMatchingSubmissionIds = new Set<string>();

    for (const id of submissionIdsFromHackers) {
      allMatchingSubmissionIds.add(id);
    }

    for (const id of submissionIdsFromPayload) {
      allMatchingSubmissionIds.add(id);
    }

    if (allMatchingSubmissionIds.size > 0) {
      submissionIdsToFilter = Array.from(allMatchingSubmissionIds);
    } else {
      // No matching results, return empty
      return {
        submissions: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
          totalParticipants: 0,
        },
      };
    }
  }

  // Build where conditions for submissions
  const conditions: any[] = [];

  if (eventId) {
    conditions.push(eq(submissions.eventId, eventId));
  }

  if (status && status.length > 0) {
    conditions.push(inArray(submissions.status, status));
  }

  if (cohort && cohort.length > 0) {
    conditions.push(inArray(submissions.cohort, cohort));
  }

  if (modality && modality.length > 0) {
    conditions.push(inArray(submissions.modality, modality));
  }

  if (country) {
    conditions.push(eq(submissions.country, country));
  }

  if (submissionIdsToFilter) {
    conditions.push(inArray(submissions.id, submissionIdsToFilter));
  }

  if (submittedAfter) {
    conditions.push(sql`${submissions.submittedAt} >= ${submittedAfter}`);
  }

  if (submittedBefore) {
    conditions.push(sql`${submissions.submittedAt} <= ${submittedBefore}`);
  }

  // Filter by hasFlightRequest using EXISTS subquery
  if (hasFlightRequest !== undefined) {
    if (hasFlightRequest) {
      conditions.push(
        sql`EXISTS (SELECT 1 FROM ${flightRequests} WHERE ${flightRequests.submissionId} = ${submissions.id})`,
      );
    } else {
      conditions.push(
        sql`NOT EXISTS (SELECT 1 FROM ${flightRequests} WHERE ${flightRequests.submissionId} = ${submissions.id})`,
      );
    }
  }

  // Filter by hasReview using EXISTS subquery
  if (hasReview !== undefined) {
    if (hasReview) {
      conditions.push(
        sql`EXISTS (SELECT 1 FROM ${reviews} WHERE ${reviews.submissionId} = ${submissions.id})`,
      );
    } else {
      conditions.push(
        sql`NOT EXISTS (SELECT 1 FROM ${reviews} WHERE ${reviews.submissionId} = ${submissions.id})`,
      );
    }
  }

  // Filter by hasWomen using EXISTS subquery to check if any member is female
  if (hasWomen !== undefined && hasWomen) {
    conditions.push(
      sql`EXISTS (
        SELECT 1 FROM ${hackerProfiles}
        INNER JOIN ${hackers} ON ${hackerProfiles.hackerId} = ${hackers.id}
        WHERE ${hackerProfiles.submissionId} = ${submissions.id}
        AND ${hackers.gender} = 'female'
      )`,
    );
  }

  const _whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Filter by qualification using EXISTS subquery to avoid duplicates
  if (
    qualification &&
    Array.isArray(qualification) &&
    qualification.length > 0
  ) {
    // Filter out any undefined values
    const validQualifications = qualification.filter(
      (q: any) => q !== undefined,
    ) as ReviewQualification[];

    if (validQualifications.length > 0) {
      conditions.push(
        sql`EXISTS (
          SELECT 1 FROM ${reviews}
          WHERE ${reviews.submissionId} = ${submissions.id}
          AND ${inArray(reviews.qualification, validQualifications)}
        )`,
      );
    }
  }

  // Rebuild whereClause with qualification conditions
  const finalWhereClause =
    conditions.length > 0 ? and(...conditions) : undefined;

  // Get submissions with sorted results
  const submissionsResult = await db
    .select()
    .from(submissions)
    .where(finalWhereClause)
    .orderBy(
      sortOrder === 'asc'
        ? asc(submissions.submittedAt)
        : desc(submissions.submittedAt),
    )
    .limit(limit)
    .offset(offset);

  // Get total count using the same conditions
  const [{ total }] = await db
    .select({ total: count() })
    .from(submissions)
    .where(finalWhereClause);

  // Get total participants count for the filtered submissions
  const totalParticipantsResult = await db
    .select({ count: count(hackerProfiles.id) })
    .from(submissions)
    .innerJoin(hackerProfiles, eq(submissions.id, hackerProfiles.submissionId))
    .where(finalWhereClause);

  const totalParticipants = totalParticipantsResult[0]?.count ?? 0;

  const submissionsWithMembers: SubmissionWithMembers[] = await Promise.all(
    submissionsResult.map(async (submission) => {
      let members: any[] = [];

      // First try to get members through hacker_profiles (for direct submissions)
      const profileMembers = await db
        .select({
          id: hackers.id,
          fullName: hackers.fullName,
          email: hackers.email,
          github: hackers.github,
          linkedin: hackers.linkedin,
          gender: hackers.gender,
          profile: {
            age: hackerProfiles.age,
            bio: hackerProfiles.bio,
            education: hackerProfiles.education,
            isVeteran: hackerProfiles.isVeteran,
            previousHackathons: hackerProfiles.previousHackathons,
            shirtSize: hackerProfiles.shirtSize,
            diet: hackerProfiles.diet,
            allergies: hackerProfiles.allergies,
            physicalIssues: hackerProfiles.physicalIssues,
            country: hackerProfiles.country,
          },
        })
        .from(hackerProfiles)
        .leftJoin(hackers, eq(hackerProfiles.hackerId, hackers.id))
        .where(eq(hackerProfiles.submissionId, submission.id))
        .orderBy(asc(hackers.fullName));

      members = profileMembers;

      // Check if submission has flight requests
      const [flightRequestCount] = await db
        .select({ count: count() })
        .from(flightRequests)
        .where(eq(flightRequests.submissionId, submission.id));

      // Get reviews for this submission
      const submissionReviews = await db
        .select({
          id: reviews.id,
          qualification: reviews.qualification,
          reviewerId: reviews.reviewerId,
          createdAt: reviews.createdAt,
        })
        .from(reviews)
        .where(eq(reviews.submissionId, submission.id));

      return {
        submission,
        members: members as any,
        hasFlightRequest: (flightRequestCount?.count ?? 0) > 0,
        reviews: submissionReviews,
      };
    }),
  );

  const totalPages = Math.ceil(total / limit);

  return {
    submissions: submissionsWithMembers,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      totalParticipants,
    },
  };
}

export async function getUniqueCountriesForReviewSubmissions(
  eventId: string,
): Promise<string[]> {
  const countries = await db
    .selectDistinct({ country: submissions.country })
    .from(submissions)
    .where(eq(submissions.eventId, eventId))
    .orderBy(asc(submissions.country));

  return countries.map((c) => c.country).filter(Boolean);
}

export interface SubmissionDetailData {
  submission: Submission;
  event: {
    id: string;
    name: string;
    slug: string;
    domain: string;
    priorityAnswerDate: Date | null;
  };
  members: Array<{
    id: string;
    publicId: string;
    email: string;
    fullName: string;
    github: string | null;
    linkedin: string | null;
    gender: 'male' | 'female' | null;
    role: string;
    isPreviousParticipant: boolean;
    hack24SubmissionId: string | null;
    profile: {
      age: number | null;
      bio: string | null;
      education: string | null;
      isVeteran: boolean;
      previousHackathons: string | null;
      shirtSize: string | null;
      diet: string | null;
      allergies: string | null;
      physicalIssues: string | null;
      shareInfoWithSponsors: boolean;
      country: string | null;
      nationalId: string | null;
      shoeSize: number | null;
      emergencyContactName: string | null;
      emergencyContactPhone: string | null;
      discordId: string | null;
      discordUsername: string | null;
      discordConnectedAt: Date | null;
      anthropicOrgId: string | null;
      anthropicUsedProducts: string[] | null;
      anthropicAccountEmail: string | null;
      anthropicUpdates: boolean | null;
      anthropicInfoSentAt: Date | null;
      onboardCompleteAt: Date | null;
      termsAcceptedAt: Date | null;
    } | null;
    notes: Array<{
      id: string;
      hackerId: string;
      authorAdminId: string;
      body: string;
      createdAt: Date;
      author: {
        fullName: string;
        email: string;
      };
    }>;
  }>;
  statusHistory: Array<{
    id: string;
    submissionId: string;
    fromStatus: string | null;
    toStatus: string;
    changedBy: string | null;
    context: any;
    changedAt: Date;
    changedByAdmin: {
      fullName: string;
      email: string;
    } | null;
  }>;
  notes: Array<{
    id: string;
    submissionId: string;
    authorAdminId: string;
    body: string;
    createdAt: Date;
    author: {
      fullName: string;
      email: string;
    };
  }>;
  flightRequests: Array<{
    id: string;
    submissionId: string;
    authorAdminId: string;
    content: string;
    createdAt: Date;
    author: {
      fullName: string;
      email: string;
    };
  }>;
  reviews: Array<{
    id: string;
    submissionId: string;
    reviewerId: string;
    qualification: string;
    createdAt: Date;
    reviewer: {
      fullName: string;
      email: string;
    };
  }>;
}

export async function createSubmissionNote(data: {
  submissionId: string;
  authorAdminId: string;
  body: string;
}) {
  const [note] = await db.insert(submissionNotes).values(data).returning();
  return note;
}

export async function createFlightRequest(data: InsertFlightRequest) {
  const [request] = await db.insert(flightRequests).values(data).returning();
  return request;
}

export async function getFlightRequestsBySubmission(submissionId: string) {
  return db
    .select({
      id: flightRequests.id,
      submissionId: flightRequests.submissionId,
      authorAdminId: flightRequests.authorAdminId,
      content: flightRequests.content,
      createdAt: flightRequests.createdAt,
      authorName: admins.fullName,
      authorEmail: admins.email,
    })
    .from(flightRequests)
    .innerJoin(admins, eq(flightRequests.authorAdminId, admins.id))
    .where(eq(flightRequests.submissionId, submissionId))
    .orderBy(desc(flightRequests.createdAt));
}

export async function getSubmissionDetails(
  submissionId: string,
): Promise<SubmissionDetailData | null> {
  // Get submission
  const [submission] = await db
    .select()
    .from(submissions)
    .where(eq(submissions.id, submissionId));

  if (!submission) {
    return null;
  }

  const [event] = await db
    .select({
      id: events.id,
      name: events.name,
      slug: events.slug,
      domain: events.domain,
      priorityAnswerDate: events.priorityAnswerDate,
    })
    .from(events)
    .where(eq(events.id, submission.eventId))
    .limit(1);

  if (!event) {
    return null;
  }

  let members: any[] = [];
  const profileRecords = await db
    .select({
      id: hackers.id,
      publicId: hackers.publicId,
      email: hackers.email,
      fullName: hackers.fullName,
      github: hackers.github,
      linkedin: hackers.linkedin,
      gender: hackers.gender,
      profileAge: hackerProfiles.age,
      profileBio: hackerProfiles.bio,
      profileEducation: hackerProfiles.education,
      profileIsVeteran: hackerProfiles.isVeteran,
      profilePreviousHackathons: hackerProfiles.previousHackathons,
      profileShirtSize: hackerProfiles.shirtSize,
      profileDiet: hackerProfiles.diet,
      profileAllergies: hackerProfiles.allergies,
      profilePhysicalIssues: hackerProfiles.physicalIssues,
      profileShareInfoWithSponsors: hackerProfiles.shareInfoWithSponsors,
      profileCountry: hackerProfiles.country,
      profileNationalId: hackerProfiles.nationalId,
      profileShoeSize: hackerProfiles.shoeSize,
      profileEmergencyContactName: hackerProfiles.emergencyContactName,
      profileEmergencyContactPhone: hackerProfiles.emergencyContactPhone,
      profileDiscordId: hackerProfiles.discordId,
      profileDiscordUsername: hackerProfiles.discordUsername,
      profileDiscordConnectedAt: hackerProfiles.discordConnectedAt,
      profileAnthropicOrgId: hackerProfiles.anthropicOrgId,
      profileAnthropicUsedProducts: hackerProfiles.anthropicUsedProducts,
      profileAnthropicAccountEmail: hackerProfiles.anthropicAccountEmail,
      profileAnthropicUpdates: hackerProfiles.anthropicUpdates,
      profileAnthropicInfoSentAt: hackerProfiles.anthropicInfoSentAt,
      profileOnboardCompleteAt: hackerProfiles.onboardCompleteAt,
      profileTermsAcceptedAt: hackerProfiles.termsAcceptedAt,
    })
    .from(hackerProfiles)
    .innerJoin(hackers, eq(hackerProfiles.hackerId, hackers.id))
    .where(eq(hackerProfiles.submissionId, submissionId))
    .orderBy(asc(hackers.fullName));

  const memberHackerIds = profileRecords.map((m) => m.id);
  const previousParticipants =
    memberHackerIds.length > 0
      ? await db
          .select({ hackerId: hackerProfiles.hackerId })
          .from(hackerProfiles)
          .innerJoin(
            submissions,
            eq(hackerProfiles.submissionId, submissions.id),
          )
          .where(
            and(
              inArray(hackerProfiles.hackerId, memberHackerIds),
              eq(submissions.status, 'onboarding_complete'),
              sql`${submissions.id} != ${submissionId}`,
            ),
          )
          .then((result) => new Set(result.map((r) => r.hackerId)))
      : new Set<string>();

  const hack24Event = await db
    .select({ id: events.id })
    .from(events)
    .where(eq(events.name, 'Platanus Hack 24'))
    .limit(1);

  const hack24Applicants =
    hack24Event.length > 0 && memberHackerIds.length > 0
      ? await db
          .select({
            hackerId: hackerProfiles.hackerId,
            submissionId: hackerProfiles.submissionId,
          })
          .from(hackerProfiles)
          .innerJoin(
            submissions,
            eq(hackerProfiles.submissionId, submissions.id),
          )
          .where(
            and(
              inArray(hackerProfiles.hackerId, memberHackerIds),
              eq(submissions.eventId, hack24Event[0].id),
              sql`${submissions.status} != 'onboarding_complete'`,
            ),
          )
          .then(
            (result) =>
              new Map(result.map((r) => [r.hackerId, r.submissionId])),
          )
      : new Map<string, string>();

  members = profileRecords.map((member) => ({
    id: member.id,
    publicId: member.publicId,
    email: member.email,
    fullName: member.fullName,
    github: member.github,
    linkedin: member.linkedin,
    gender: member.gender,
    role: submission.isTeam ? 'member' : 'solo',
    isPreviousParticipant: previousParticipants.has(member.id),
    hack24SubmissionId: hack24Applicants.get(member.id) || null,
    profile:
      member.profileAge !== null || member.profileBio !== null
        ? {
            age: member.profileAge,
            bio: member.profileBio,
            education: member.profileEducation,
            isVeteran: member.profileIsVeteran ?? false,
            previousHackathons: member.profilePreviousHackathons,
            shirtSize: member.profileShirtSize,
            diet: member.profileDiet,
            allergies: member.profileAllergies,
            physicalIssues: member.profilePhysicalIssues,
            shareInfoWithSponsors: member.profileShareInfoWithSponsors ?? false,
            country: member.profileCountry,
            nationalId: member.profileNationalId,
            shoeSize: member.profileShoeSize,
            emergencyContactName: member.profileEmergencyContactName,
            emergencyContactPhone: member.profileEmergencyContactPhone,
            discordId: member.profileDiscordId,
            discordUsername: member.profileDiscordUsername,
            discordConnectedAt: member.profileDiscordConnectedAt,
            anthropicOrgId: member.profileAnthropicOrgId,
            anthropicUsedProducts: member.profileAnthropicUsedProducts,
            anthropicAccountEmail: member.profileAnthropicAccountEmail,
            anthropicUpdates: member.profileAnthropicUpdates,
            anthropicInfoSentAt: member.profileAnthropicInfoSentAt,
            onboardCompleteAt: member.profileOnboardCompleteAt,
            termsAcceptedAt: member.profileTermsAcceptedAt,
          }
        : null,
  }));

  // Get hacker notes for all members
  const hackerIds = members.map((m) => m.id);
  const hackerNotesRecords =
    hackerIds.length > 0
      ? await db
          .select({
            id: hackerNotes.id,
            hackerId: hackerNotes.hackerId,
            authorAdminId: hackerNotes.authorAdminId,
            body: hackerNotes.body,
            createdAt: hackerNotes.createdAt,
            authorName: admins.fullName,
            authorEmail: admins.email,
          })
          .from(hackerNotes)
          .innerJoin(admins, eq(hackerNotes.authorAdminId, admins.id))
          .where(inArray(hackerNotes.hackerId, hackerIds))
          .orderBy(desc(hackerNotes.createdAt))
      : [];

  // Group notes by hackerId
  const notesByHackerId: Record<string, any[]> = {};
  for (const note of hackerNotesRecords) {
    if (!notesByHackerId[note.hackerId]) {
      notesByHackerId[note.hackerId] = [];
    }
    notesByHackerId[note.hackerId].push({
      id: note.id,
      hackerId: note.hackerId,
      authorAdminId: note.authorAdminId,
      body: note.body,
      createdAt: note.createdAt,
      author: {
        fullName: note.authorName,
        email: note.authorEmail,
      },
    });
  }

  // Add notes to each member
  members = members.map((member) => ({
    ...member,
    notes: notesByHackerId[member.id] || [],
  }));

  // Get status history with admin info
  const statusHistoryRecords = await db
    .select({
      id: statusHistory.id,
      submissionId: statusHistory.submissionId,
      fromStatus: statusHistory.fromStatus,
      toStatus: statusHistory.toStatus,
      changedBy: statusHistory.changedBy,
      context: statusHistory.context,
      changedAt: statusHistory.changedAt,
      changedByAdminName: admins.fullName,
      changedByAdminEmail: admins.email,
    })
    .from(statusHistory)
    .leftJoin(admins, eq(statusHistory.changedBy, admins.id))
    .where(eq(statusHistory.submissionId, submissionId))
    .orderBy(desc(statusHistory.changedAt));

  const statusHistoryWithAdmin = statusHistoryRecords.map((record) => ({
    id: record.id,
    submissionId: record.submissionId,
    fromStatus: record.fromStatus,
    toStatus: record.toStatus,
    changedBy: record.changedBy,
    context: record.context,
    changedAt: record.changedAt,
    changedByAdmin:
      record.changedByAdminName && record.changedByAdminEmail
        ? {
            fullName: record.changedByAdminName,
            email: record.changedByAdminEmail,
          }
        : null,
  }));

  // Get notes with author info
  const notesRecords = await db
    .select({
      id: submissionNotes.id,
      submissionId: submissionNotes.submissionId,
      authorAdminId: submissionNotes.authorAdminId,
      body: submissionNotes.body,
      createdAt: submissionNotes.createdAt,
      authorName: admins.fullName,
      authorEmail: admins.email,
    })
    .from(submissionNotes)
    .innerJoin(admins, eq(submissionNotes.authorAdminId, admins.id))
    .where(eq(submissionNotes.submissionId, submissionId))
    .orderBy(desc(submissionNotes.createdAt));

  const notesWithAuthor = notesRecords.map((record) => ({
    id: record.id,
    submissionId: record.submissionId,
    authorAdminId: record.authorAdminId,
    body: record.body,
    createdAt: record.createdAt,
    author: {
      fullName: record.authorName,
      email: record.authorEmail,
    },
  }));

  // Get flight requests with author info
  const flightRequestRecords = await db
    .select({
      id: flightRequests.id,
      submissionId: flightRequests.submissionId,
      authorAdminId: flightRequests.authorAdminId,
      content: flightRequests.content,
      createdAt: flightRequests.createdAt,
      authorName: admins.fullName,
      authorEmail: admins.email,
    })
    .from(flightRequests)
    .innerJoin(admins, eq(flightRequests.authorAdminId, admins.id))
    .where(eq(flightRequests.submissionId, submissionId))
    .orderBy(desc(flightRequests.createdAt));

  const flightRequestsWithAuthor = flightRequestRecords.map((record) => ({
    id: record.id,
    submissionId: record.submissionId,
    authorAdminId: record.authorAdminId,
    content: record.content,
    createdAt: record.createdAt,
    author: {
      fullName: record.authorName,
      email: record.authorEmail,
    },
  }));

  // Get reviews with reviewer info
  const reviewRecords = await db
    .select({
      id: reviews.id,
      submissionId: reviews.submissionId,
      reviewerId: reviews.reviewerId,
      qualification: reviews.qualification,
      createdAt: reviews.createdAt,
      reviewerName: admins.fullName,
      reviewerEmail: admins.email,
    })
    .from(reviews)
    .innerJoin(admins, eq(reviews.reviewerId, admins.id))
    .where(eq(reviews.submissionId, submissionId))
    .orderBy(desc(reviews.createdAt));

  const reviewsWithReviewer = reviewRecords.map((record) => ({
    id: record.id,
    submissionId: record.submissionId,
    reviewerId: record.reviewerId,
    qualification: record.qualification,
    createdAt: record.createdAt,
    reviewer: {
      fullName: record.reviewerName,
      email: record.reviewerEmail,
    },
  }));

  return {
    submission,
    event,
    members,
    statusHistory: statusHistoryWithAdmin,
    notes: notesWithAuthor,
    flightRequests: flightRequestsWithAuthor,
    reviews: reviewsWithReviewer,
  };
}

export async function updateSubmissionStatus(
  submissionId: string,
  toStatus: SubmissionStatus,
  adminId: string | null,
  context?: Record<string, unknown>,
): Promise<{
  success: boolean;
  fromStatus?: SubmissionStatus;
  error?: string;
}> {
  try {
    // Get current submission
    const [submission] = await db
      .select()
      .from(submissions)
      .where(eq(submissions.id, submissionId))
      .limit(1);

    if (!submission) {
      return {
        success: false,
        error: 'Submission not found',
      };
    }

    const fromStatus = submission.status;

    // Update submission status
    await db
      .update(submissions)
      .set({ status: toStatus })
      .where(eq(submissions.id, submissionId));

    // Add to status history
    await db.insert(statusHistory).values({
      submissionId,
      fromStatus,
      toStatus,
      changedBy: adminId,
      context,
    });

    return {
      success: true,
      fromStatus,
    };
  } catch (error) {
    console.error('Error updating submission status:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to update submission status',
    };
  }
}

export async function getSubmissionById(
  submissionId: string,
): Promise<Submission | null> {
  const [submission] = await db
    .select()
    .from(submissions)
    .where(eq(submissions.id, submissionId))
    .limit(1);

  return submission || null;
}

export interface DuplicateHackerInNewerSubmission {
  hackerId: string;
  hackerName: string;
  hackerGithub: string | null;
  newerSubmissionId: string;
  newerSubmissionSubmittedAt: Date;
}

export async function getDuplicateHackersInNewerSubmissions(
  submissionId: string,
): Promise<DuplicateHackerInNewerSubmission[]> {
  const [currentSubmission] = await db
    .select()
    .from(submissions)
    .where(eq(submissions.id, submissionId))
    .limit(1);

  if (!currentSubmission) {
    return [];
  }

  const currentMembers = await db
    .select({ hackerId: hackerProfiles.hackerId })
    .from(hackerProfiles)
    .where(eq(hackerProfiles.submissionId, submissionId));

  if (currentMembers.length === 0) {
    return [];
  }

  const hackerIds = currentMembers.map((m) => m.hackerId);

  const newerSubmissions = await db
    .select({
      hackerId: hackerProfiles.hackerId,
      hackerName: hackers.fullName,
      hackerGithub: hackers.github,
      newerSubmissionId: submissions.id,
      newerSubmissionSubmittedAt: submissions.submittedAt,
    })
    .from(hackerProfiles)
    .innerJoin(hackers, eq(hackerProfiles.hackerId, hackers.id))
    .innerJoin(submissions, eq(hackerProfiles.submissionId, submissions.id))
    .where(
      and(
        inArray(hackerProfiles.hackerId, hackerIds),
        eq(submissions.eventId, currentSubmission.eventId),
        gt(submissions.submittedAt, currentSubmission.submittedAt),
        ne(submissions.id, submissionId),
        ne(submissions.status, 'archived'),
      ),
    )
    .orderBy(asc(submissions.submittedAt));

  return newerSubmissions;
}

export async function deleteSubmissionWithData(submissionId: string): Promise<{
  success: boolean;
  message?: string;
  hackersDeleted: number;
  error?: string;
}> {
  try {
    // Get full submission details before deletion
    const submissionData = await getSubmissionDetails(submissionId);

    if (!submissionData) {
      return {
        success: false,
        hackersDeleted: 0,
        error: 'Submission not found',
      };
    }

    // Download/log all submission data
    const downloadData = {
      submission: submissionData.submission,
      members: submissionData.members,
      statusHistory: submissionData.statusHistory,
      submissionNotes: submissionData.notes,
      flightRequests: submissionData.flightRequests,
      reviews: submissionData.reviews,
      deletedAt: new Date().toISOString(),
    };

    // Log the deleted data to console (in production, this could be sent to a logging service or stored in a backup table)
    console.log('=== DELETED SUBMISSION DATA ===');
    console.log(JSON.stringify(downloadData, null, 2));
    console.log('=== END DELETED SUBMISSION DATA ===');

    // Get all hacker IDs from this submission
    const hackerIds = submissionData.members.map((m) => m.id);

    // For each hacker, check if they have other hacker profiles
    const hackersToDelete: string[] = [];

    for (const hackerId of hackerIds) {
      // Get count of hacker profiles for this hacker
      const profiles = await db
        .select()
        .from(hackerProfiles)
        .where(eq(hackerProfiles.hackerId, hackerId));

      // If this hacker only has one profile (the one being deleted), mark for deletion
      if (profiles.length === 1 && profiles[0].submissionId === submissionId) {
        hackersToDelete.push(hackerId);
      }
    }

    // Delete the submission (cascade will handle most related data automatically)
    // This will cascade delete:
    // - hacker_profiles (via FK constraint)
    // - submission_notes (via FK constraint)
    // - status_history (via FK constraint)
    // - flight_requests (via FK constraint)
    // - reviews (via FK constraint)
    await db.delete(submissions).where(eq(submissions.id, submissionId));

    // Delete hackers who have no other profiles
    if (hackersToDelete.length > 0) {
      console.log(
        `Deleting ${hackersToDelete.length} hackers with no other profiles:`,
        hackersToDelete,
      );

      // Delete hacker notes for these hackers (if any)
      for (const hackerId of hackersToDelete) {
        await db.delete(hackerNotes).where(eq(hackerNotes.hackerId, hackerId));
      }

      // Delete the hackers themselves
      for (const hackerId of hackersToDelete) {
        await db.delete(hackers).where(eq(hackers.id, hackerId));
      }
    }

    return {
      success: true,
      message: `Submission deleted successfully. ${hackersToDelete.length} hacker(s) removed.`,
      hackersDeleted: hackersToDelete.length,
    };
  } catch (error) {
    console.error('Error deleting submission:', error);
    return {
      success: false,
      hackersDeleted: 0,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to delete submission. Please try again.',
    };
  }
}

export async function archiveSubmission(
  submissionId: string,
  adminId?: string,
): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const submissionData = await getSubmissionDetails(submissionId);

    if (!submissionData) {
      return {
        success: false,
        error: 'Submission not found',
      };
    }

    const currentStatus = submissionData.submission.status;

    await db
      .update(submissions)
      .set({ status: 'archived' })
      .where(eq(submissions.id, submissionId));

    await db.insert(statusHistory).values({
      submissionId,
      fromStatus: currentStatus,
      toStatus: 'archived',
      changedBy: adminId,
      context: { action: 'archive' },
    });

    return {
      success: true,
      message: 'Submission archived successfully',
    };
  } catch (error) {
    console.error('Error archiving submission:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to archive submission. Please try again.',
    };
  }
}

export async function getLatestStatusChange(submissionId: string) {
  try {
    const latestChange = await db
      .select({
        id: statusHistory.id,
        submissionId: statusHistory.submissionId,
        fromStatus: statusHistory.fromStatus,
        toStatus: statusHistory.toStatus,
        changedBy: statusHistory.changedBy,
        context: statusHistory.context,
        changedAt: statusHistory.changedAt,
      })
      .from(statusHistory)
      .where(eq(statusHistory.submissionId, submissionId))
      .orderBy(desc(statusHistory.changedAt))
      .limit(1);

    return latestChange[0] || null;
  } catch (error) {
    console.error('Error fetching latest status change:', error);
    return null;
  }
}

export async function getSubmissionStatusHistory(submissionId: string) {
  try {
    const history = await db
      .select({
        id: statusHistory.id,
        submissionId: statusHistory.submissionId,
        fromStatus: statusHistory.fromStatus,
        toStatus: statusHistory.toStatus,
        changedBy: statusHistory.changedBy,
        context: statusHistory.context,
        changedAt: statusHistory.changedAt,
      })
      .from(statusHistory)
      .where(eq(statusHistory.submissionId, submissionId))
      .orderBy(desc(statusHistory.changedAt));

    return history;
  } catch (error) {
    console.error('Error fetching submission status history:', error);
    return [];
  }
}

export async function getSubmissionsInStatus(
  status: SubmissionStatus,
): Promise<Submission[]> {
  try {
    const submissionsInStatus = await db
      .select()
      .from(submissions)
      .where(eq(submissions.status, status));

    return submissionsInStatus;
  } catch (error) {
    console.error(`Error fetching submissions in status ${status}:`, error);
    return [];
  }
}

export async function getStatusChangeForSubmission(
  submissionId: string,
  toStatus: SubmissionStatus,
) {
  try {
    const [statusChange] = await db
      .select()
      .from(statusHistory)
      .where(
        and(
          eq(statusHistory.submissionId, submissionId),
          eq(statusHistory.toStatus, toStatus),
        ),
      )
      .orderBy(desc(statusHistory.changedAt))
      .limit(1);

    return statusChange || null;
  } catch (error) {
    console.error('Error fetching status change:', error);
    return null;
  }
}

export async function hasEmailBeenSentToAddress(
  emailAddress: string,
  templateName: string,
): Promise<boolean> {
  try {
    const [email] = await db
      .select()
      .from(outboundEmails)
      .where(
        and(
          eq(outboundEmails.to, emailAddress),
          eq(outboundEmails.templateName, templateName),
        ),
      )
      .limit(1);

    return !!email;
  } catch (error) {
    console.error('Error checking if email has been sent to address:', error);
    return false;
  }
}

export async function getOnboardingCompletionStats(eventId: string): Promise<{
  completed: number;
  total: number;
  percentage: number;
}> {
  try {
    // Get all hacker profiles for onboarding_request or onboarding_complete submissions
    const allProfiles = await db
      .select({
        id: hackerProfiles.id,
        onboardCompleteAt: hackerProfiles.onboardCompleteAt,
      })
      .from(hackerProfiles)
      .innerJoin(submissions, eq(hackerProfiles.submissionId, submissions.id))
      .where(
        and(
          eq(submissions.eventId, eventId),
          inArray(submissions.status, [
            'onboarding_request',
            'onboarding_complete',
          ]),
        ),
      );

    const total = allProfiles.length;

    // Count profiles with onboardCompleteAt set (not null)
    const completed = allProfiles.filter(
      (profile) => profile.onboardCompleteAt !== null,
    ).length;

    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      completed,
      total,
      percentage,
    };
  } catch (error) {
    console.error('Error fetching onboarding completion stats:', error);
    return {
      completed: 0,
      total: 0,
      percentage: 0,
    };
  }
}
