import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  json,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const adminRoles = ['full', 'guest'] as const;
export type AdminRole = (typeof adminRoles)[number];
export const adminRoleEnum = pgEnum('admin_role', adminRoles);

export const userTypes = ['hacker', 'admin', 'voter'] as const;
export type UserType = (typeof userTypes)[number];
export const userTypeEnum = pgEnum('user_type', userTypes);

export const submissionStatuses = [
  'received',
  'priority_waiting',
  'asking_self_finance_trip',
  'approved',
  'onboarding_request',
  'onboarding_expired',
  'onboarding_complete',
  'rejected',
  'waiting_list',
  'withdrawn',
  'archived',
] as const;
export type SubmissionStatus = (typeof submissionStatuses)[number];
export const submissionStatusEnum = pgEnum(
  'submission_status',
  submissionStatuses,
);

export const cohorts = ['priority', 'final'] as const;
export type Cohort = (typeof cohorts)[number];
export const cohortEnum = pgEnum('cohort', cohorts);

export const submissionModalities = ['solo', 'team', 'team_looking'] as const;
export type SubmissionModality = (typeof submissionModalities)[number];
export const submissionModalityEnum = pgEnum(
  'submission_modality',
  submissionModalities,
);

export const inviteStates = [
  'pending',
  'accepted',
  'revoked',
  'expired',
] as const;
export type InviteState = (typeof inviteStates)[number];
export const inviteStateEnum = pgEnum('invite_state', inviteStates);

export const rsvpStatuses = ['pending', 'confirmed', 'declined'] as const;
export type RsvpStatus = (typeof rsvpStatuses)[number];
export const rsvpStatusEnum = pgEnum('rsvp_status', rsvpStatuses);

export const submissionSources = ['tally', 'in-house'] as const;
export type SubmissionSource = (typeof submissionSources)[number];
export const submissionSourceEnum = pgEnum(
  'submission_source',
  submissionSources,
);

export const checkinVias = ['qr', 'manual'] as const;
export type CheckinVia = (typeof checkinVias)[number];
export const checkinViaEnum = pgEnum('checkin_via', checkinVias);

export const genders = ['male', 'female'] as const;
export type Gender = (typeof genders)[number];
export const genderEnum = pgEnum('gender', genders);

export const events = pgTable('events', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  domain: text('domain').notNull().default('https://hack.platan.us'),
  photosAlbumUrl: text('photos_album_url'),
  priorityAnswerDate: timestamp('priority_answer_date', { withTimezone: true }),
  priorityDeadlineAt: timestamp('priority_deadline_at', { withTimezone: true }),
  finalDeadlineAt: timestamp('final_deadline_at', { withTimezone: true }),
  startsAt: timestamp('starts_at', { withTimezone: true }),
  endsAt: timestamp('ends_at', { withTimezone: true }),
  rsvpOpenAt: timestamp('rsvp_open_at', { withTimezone: true }),
  votingStartsAt: timestamp('voting_starts_at', { withTimezone: true }),
  votingEndsAt: timestamp('voting_ends_at', { withTimezone: true }),
  trackSelectionStartTime: timestamp('track_selection_start_time', {
    withTimezone: true,
  }),
  mentorSelectionStartTime: timestamp('mentor_selection_start_time', {
    withTimezone: true,
  }),
  feedbackPrizeDeadline: timestamp('feedback_prize_deadline', {
    withTimezone: true,
  }),
  capacityTeams: integer('capacity_teams'),
  capacityHackers: integer('capacity_hackers'),
  targetSubmission: integer('target_submission'),
  trackTeamLimit: integer('track_team_limit'),
  mentorTeamLimit: integer('mentor_team_limit'),
  spotifyRefreshToken: text('spotify_refresh_token'),
  spotifyAccessToken: text('spotify_access_token'),
  spotifyTokenExpiresAt: timestamp('spotify_token_expires_at', {
    withTimezone: true,
  }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type Event = InferSelectModel<typeof events>;
export type InsertEvent = InferInsertModel<typeof events>;

// Define submissions first to avoid circular reference
export const submissions = pgTable('submissions', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  eventId: uuid('event_id')
    .notNull()
    .references(() => events.id, { onDelete: 'cascade' }),
  teamId: uuid('team_id'), // No FK constraint due to circular dependency
  tallySubmissionId: text('tally_submission_id').notNull().unique(),
  rawPayload: json('raw_payload').notNull(),
  isTeam: boolean('is_team').notNull(),
  modality: submissionModalityEnum('modality').notNull(),
  status: submissionStatusEnum('status').notNull().default('received'),
  cohort: cohortEnum('cohort').notNull(),
  country: text('country').notNull(),
  submittedAt: timestamp('submitted_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  source: submissionSourceEnum('source').notNull().default('tally'),
});

export type Submission = InferSelectModel<typeof submissions>;
export type InsertSubmission = InferInsertModel<typeof submissions>;

export const tracks = pgTable(
  'tracks',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    eventIdIdx: index('tracks_event_id_idx').on(table.eventId),
  }),
);

export type Track = InferSelectModel<typeof tracks>;
export type InsertTrack = InferInsertModel<typeof tracks>;

export const teams = pgTable('teams', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  eventId: uuid('event_id')
    .notNull()
    .references(() => events.id, { onDelete: 'cascade' }),
  trackId: uuid('track_id').references(() => tracks.id, {
    onDelete: 'set null',
  }),
  trackSelectorId: uuid('track_selector_id').references(() => hackers.id, {
    onDelete: 'set null',
  }),
  mentorId: uuid('mentor_id').references(() => mentors.id, {
    onDelete: 'set null',
  }),
  slug: text('slug').notNull().unique(),
  formedOnSite: boolean('formed_on_site').notNull().default(false),
  tableNumber: text('table_number'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type Team = InferSelectModel<typeof teams>;
export type InsertTeam = InferInsertModel<typeof teams>;

export const hackers = pgTable(
  'hackers',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    publicId: uuid('public_id').notNull().defaultRandom().unique(),
    email: varchar('email', { length: 255 }).notNull(),
    fullName: text('full_name').notNull(),
    github: text('github'),
    linkedin: text('linkedin'),
    gender: genderEnum('gender'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    emailIdx: index('hackers_email_idx').on(table.email),
    githubIdx: index('hackers_github_idx').on(table.github),
  }),
);

export type Hacker = InferSelectModel<typeof hackers>;
export type InsertHacker = InferInsertModel<typeof hackers>;

export const hackerProfiles = pgTable(
  'hacker_profiles',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    hackerId: uuid('hacker_id')
      .notNull()
      .references(() => hackers.id, { onDelete: 'cascade' }),
    submissionId: uuid('submission_id')
      .notNull()
      .references(() => submissions.id, { onDelete: 'cascade' }),
    teamId: uuid('team_id').references(() => teams.id, {
      onDelete: 'set null',
    }),
    age: integer('age'),
    bio: text('bio'),
    education: text('education'),
    isVeteran: boolean('is_veteran').notNull().default(false),
    previousHackathons: text('previous_hackathons'),
    shirtSize: text('shirt_size'),
    diet: text('diet'),
    allergies: text('allergies'),
    physicalIssues: text('physical_issues'),
    shareInfoWithSponsors: boolean('share_info_with_sponsors')
      .notNull()
      .default(false),
    country: text('country'),
    nationalId: text('national_id'),
    shoeSize: integer('shoe_size'),
    discordId: text('discord_id'),
    discordUsername: text('discord_username'),
    discordConnectedAt: timestamp('discord_connected_at', {
      withTimezone: true,
    }),
    anthropicOrgId: text('anthropic_org_id'),
    anthropicUsedProducts: json('anthropic_used_products').$type<string[]>(),
    anthropicAccountEmail: text('anthropic_account_email'),
    anthropicUpdates: boolean('anthropic_updates'),
    anthropicInfoSentAt: timestamp('anthropic_info_sent_at', {
      withTimezone: true,
    }),
    runwayEmail: text('runway_email'),
    runwayRequestSentAt: timestamp('runway_request_sent_at', {
      withTimezone: true,
    }),
    emergencyContactName: text('emergency_contact_name'),
    emergencyContactPhone: text('emergency_contact_phone'),
    termsAcceptedAt: timestamp('terms_accepted_at', {
      withTimezone: true,
    }),
    onboardCompleteAt: timestamp('onboard_complete_at', {
      withTimezone: true,
    }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    hackerSubmissionUnique: unique().on(table.hackerId, table.submissionId),
    discordIdIdx: index('hacker_profiles_discord_id_idx').on(table.discordId),
  }),
);

export type HackerProfile = InferSelectModel<typeof hackerProfiles>;
export type InsertHackerProfile = InferInsertModel<typeof hackerProfiles>;

export const statusHistory = pgTable('status_history', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  submissionId: uuid('submission_id')
    .notNull()
    .references(() => submissions.id, { onDelete: 'cascade' }),
  fromStatus: text('from_status'),
  toStatus: text('to_status').notNull(),
  changedBy: uuid('changed_by').references(() => admins.id),
  context: json('context'),
  changedAt: timestamp('changed_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type StatusHistory = InferSelectModel<typeof statusHistory>;
export type InsertStatusHistory = InferInsertModel<typeof statusHistory>;

export const admins = pgTable('admins', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  fullName: text('full_name').notNull(),
  role: adminRoleEnum('role').notNull().default('guest'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type Admin = InferSelectModel<typeof admins>;
export type InsertAdmin = InferInsertModel<typeof admins>;

export const reviewQualifications = [
  'hell_no',
  'no',
  'maybe',
  'yes',
  'hell_yes',
] as const;
export type ReviewQualification = (typeof reviewQualifications)[number];
export const reviewQualificationEnum = pgEnum(
  'review_qualification',
  reviewQualifications,
);

export const reviews = pgTable('reviews', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  submissionId: uuid('submission_id')
    .notNull()
    .references(() => submissions.id, { onDelete: 'cascade' }),
  reviewerId: uuid('reviewer_id')
    .notNull()
    .references(() => admins.id, { onDelete: 'cascade' }),
  qualification: reviewQualificationEnum('qualification').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Review = InferSelectModel<typeof reviews>;
export type InsertReview = InferInsertModel<typeof reviews>;

export const submissionNotes = pgTable('submission_notes', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  submissionId: uuid('submission_id')
    .notNull()
    .references(() => submissions.id, { onDelete: 'cascade' }),
  authorAdminId: uuid('author_admin_id')
    .notNull()
    .references(() => admins.id, { onDelete: 'cascade' }),
  body: text('body').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type SubmissionNote = InferSelectModel<typeof submissionNotes>;
export type InsertSubmissionNote = InferInsertModel<typeof submissionNotes>;

export const flightRequests = pgTable('flight_requests', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  submissionId: uuid('submission_id')
    .notNull()
    .references(() => submissions.id, { onDelete: 'cascade' }),
  authorAdminId: uuid('author_admin_id')
    .notNull()
    .references(() => admins.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type FlightRequest = InferSelectModel<typeof flightRequests>;
export type InsertFlightRequest = InferInsertModel<typeof flightRequests>;

export const hackerNotes = pgTable('hacker_notes', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  hackerId: uuid('hacker_id')
    .notNull()
    .references(() => hackers.id, { onDelete: 'cascade' }),
  authorAdminId: uuid('author_admin_id')
    .notNull()
    .references(() => admins.id, { onDelete: 'cascade' }),
  body: text('body').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type HackerNote = InferSelectModel<typeof hackerNotes>;
export type InsertHackerNote = InferInsertModel<typeof hackerNotes>;

export const memberScores = pgTable('member_scores', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  teamId: uuid('team_id')
    .notNull()
    .references(() => teams.id, { onDelete: 'cascade' }),
  hackerId: uuid('hacker_id')
    .notNull()
    .references(() => hackers.id, { onDelete: 'cascade' }),
  dim: json('dim').$type<Record<string, number>>(),
  total: numeric('total'),
  llmRank: json('llm_rank'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type MemberScore = InferSelectModel<typeof memberScores>;
export type InsertMemberScore = InferInsertModel<typeof memberScores>;

export const invites = pgTable('invites', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  teamId: uuid('team_id')
    .notNull()
    .references(() => teams.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  tokenHash: text('token_hash').notNull(),
  state: inviteStateEnum('state').notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
});

export type Invite = InferSelectModel<typeof invites>;
export type InsertInvite = InferInsertModel<typeof invites>;

export const rsvps = pgTable('rsvps', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  teamId: uuid('team_id')
    .notNull()
    .references(() => teams.id, { onDelete: 'cascade' }),
  hackerId: uuid('hacker_id')
    .notNull()
    .references(() => hackers.id, { onDelete: 'cascade' }),
  status: rsvpStatusEnum('status').notNull().default('pending'),
  confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Rsvp = InferSelectModel<typeof rsvps>;
export type InsertRsvp = InferInsertModel<typeof rsvps>;

export const checkins = pgTable('checkins', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  eventId: uuid('event_id')
    .notNull()
    .references(() => events.id, { onDelete: 'cascade' }),
  hackerId: uuid('hacker_id')
    .notNull()
    .references(() => hackers.id, { onDelete: 'cascade' }),
  checkedInAt: timestamp('checked_in_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  via: checkinViaEnum('via').notNull(),
  desk: text('desk'),
});

export type Checkin = InferSelectModel<typeof checkins>;
export type InsertCheckin = InferInsertModel<typeof checkins>;

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  slug: text('slug').notNull().unique(),
  teamId: uuid('team_id')
    .notNull()
    .references(() => teams.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  oneliner: text('oneliner'),
  onelinerShort: text('oneliner_short'),
  description: text('description'),
  logoUrl: text('logo_url'),
  logoHash: text('logo_hash'),
  repoUrl: text('repo_url'),
  videoUrl: text('video_url'),
  videoStartAt: integer('video_start_at'),
  videoEndAt: integer('video_end_at'),
  sourceHasSlides: boolean('source_has_slides').notNull().default(false),
  sourceHasDemo: boolean('source_has_demo').notNull().default(false),
  slidesUrl: text('slides_url'),
  deployUrl: text('deploy_url'),
  slidesMap: json('slides_map').$type<Array<[number, number]>>(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type Project = InferSelectModel<typeof projects>;
export type InsertProject = InferInsertModel<typeof projects>;

export const publicVotes = pgTable(
  'public_votes',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    votedAt: timestamp('voted_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    uniqueUserProject: unique().on(table.userId, table.projectId),
    userIdIdx: index('public_votes_user_id_idx').on(table.userId),
    projectIdIdx: index('public_votes_project_id_idx').on(table.projectId),
  }),
);

export type PublicVote = InferSelectModel<typeof publicVotes>;
export type InsertPublicVote = InferInsertModel<typeof publicVotes>;

export const outboundEmails = pgTable('OutboundEmails', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  templateName: varchar('template_name', { length: 100 }).notNull(),
  to: varchar('to', { length: 255 }).notNull(),
  cc: json('cc').$type<string[]>(),
  bcc: json('bcc').$type<string[]>(),
  replyTo: varchar('reply_to', { length: 255 }),
  subject: varchar('subject', { length: 500 }).notNull(),
  htmlContent: text('html_content').notNull(),
  textContent: text('text_content'),
  templateData: json('template_data'),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  failureReason: text('failure_reason'),
  externalMessageId: varchar('external_message_id', { length: 255 }),
  sentByAdminId: uuid('sent_by_admin_id').references(() => admins.id, {
    onDelete: 'cascade',
  }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type OutboundEmail = InferSelectModel<typeof outboundEmails>;
export type InsertOutboundEmail = InferInsertModel<typeof outboundEmails>;

export const landingSub = pgTable('LandingSub', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type LandingSub = InferSelectModel<typeof landingSub>;
export type InsertLandingSub = InferInsertModel<typeof landingSub>;

// Legacy arcade game status enum (kept for migration, unused in new schema)
export const arcadeGameStatuses = [
  'unsubmitted',
  'draft',
  'submitted',
] as const;
export type ArcadeGameStatus = (typeof arcadeGameStatuses)[number];
export const arcadeGameStatusEnum = pgEnum(
  'arcade_game_status',
  arcadeGameStatuses,
);

export const playerModes = ['single_player', 'two_player'] as const;
export type PlayerMode = (typeof playerModes)[number];
export const playerModeEnum = pgEnum('player_mode', playerModes);

export const arcadeReleaseDiagnosticStatuses = ['succeeded', 'failed'] as const;
export type ArcadeReleaseDiagnosticStatus =
  (typeof arcadeReleaseDiagnosticStatuses)[number];
export const arcadeReleaseDiagnosticStatusEnum = pgEnum(
  'arcade_release_diagnostic_status',
  arcadeReleaseDiagnosticStatuses,
);

// Arcade Challenges — one per event, holds deadlines
export const arcadeChallenges = pgTable(
  'arcade_challenges',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    submissionDeadline: timestamp('submission_deadline', {
      withTimezone: true,
    }).notNull(),
    votingDeadline: timestamp('voting_deadline', {
      withTimezone: true,
    }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    eventIdIdx: index('arcade_challenges_event_id_idx').on(table.eventId),
  }),
);

export type ArcadeChallenge = InferSelectModel<typeof arcadeChallenges>;
export type InsertArcadeChallenge = InferInsertModel<typeof arcadeChallenges>;

// Arcade Games — game identity only, no version-specific data
export const arcadeGames = pgTable(
  'arcade_games',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    challengeId: uuid('challenge_id')
      .notNull()
      .references(() => arcadeChallenges.id, { onDelete: 'cascade' }),
    githubUsername: text('github_username').notNull(),
    repoName: text('repo_name').notNull(),
    repoUrl: text('repo_url').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    githubUserChallengeUnique: unique().on(
      table.githubUsername,
      table.challengeId,
    ),
    challengeIdIdx: index('arcade_games_challenge_id_idx').on(
      table.challengeId,
    ),
  }),
);

export type ArcadeGame = InferSelectModel<typeof arcadeGames>;
export type InsertArcadeGame = InferInsertModel<typeof arcadeGames>;

// Arcade Game Versions — each version is independent and playable
export const arcadeGameVersions = pgTable(
  'arcade_game_versions',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    gameId: uuid('game_id')
      .notNull()
      .references(() => arcadeGames.id, { onDelete: 'cascade' }),
    slug: text('slug').notNull(),
    versionNumber: integer('version_number').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    code: text('code').notNull(),
    codeMinified: text('code_minified').notNull(),
    codeHash: text('code_hash'),
    coverUrl: text('cover_url'),
    coverHash: text('cover_hash'),
    commitSha: text('commit_sha'),
    commitDate: timestamp('commit_date', { withTimezone: true }),
    playerMode: playerModeEnum('player_mode')
      .notNull()
      .default('single_player'),
    arcadeMapping: json('arcade_mapping').$type<Record<string, string>>(),
    gameplayPreviewUrl: text('gameplay_preview_url'),
    gameplayPosterUrl: text('gameplay_poster_url'),
    gameplayPreviewStatus: text('gameplay_preview_status')
      .notNull()
      .default('none'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    gameVersionUnique: unique().on(table.gameId, table.versionNumber),
    gameIdIdx: index('arcade_game_versions_game_id_idx').on(table.gameId),
    gameIdVersionIdx: index('arcade_game_versions_game_id_version_idx').on(
      table.gameId,
      table.versionNumber,
    ),
    codeHashIdx: index('arcade_game_versions_code_hash_idx').on(table.codeHash),
  }),
);

export type ArcadeGameVersion = InferSelectModel<typeof arcadeGameVersions>;
export type InsertArcadeGameVersion = InferInsertModel<
  typeof arcadeGameVersions
>;

export const arcadeReleaseDiagnostics = pgTable(
  'arcade_release_diagnostics',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    eventSlug: text('event_slug').notNull(),
    challengeId: uuid('challenge_id').references(() => arcadeChallenges.id, {
      onDelete: 'cascade',
    }),
    gameId: uuid('game_id').references(() => arcadeGames.id, {
      onDelete: 'set null',
    }),
    githubUsername: text('github_username').notNull(),
    repoName: text('repo_name').notNull(),
    tag: text('tag').notNull(),
    status: arcadeReleaseDiagnosticStatusEnum('status').notNull(),
    stage: text('stage').notNull(),
    message: text('message').notNull(),
    details: json('details').$type<Record<string, unknown> | null>(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    challengeIdIdx: index('arcade_release_diagnostics_challenge_id_idx').on(
      table.challengeId,
    ),
    gameIdIdx: index('arcade_release_diagnostics_game_id_idx').on(table.gameId),
    createdAtIdx: index('arcade_release_diagnostics_created_at_idx').on(
      table.createdAt,
    ),
  }),
);

export type ArcadeReleaseDiagnostic = InferSelectModel<
  typeof arcadeReleaseDiagnostics
>;
export type InsertArcadeReleaseDiagnostic = InferInsertModel<
  typeof arcadeReleaseDiagnostics
>;

// Arcade Game Votes — simple upvote per game, follows publicVotes pattern
export const arcadeGameVotes = pgTable(
  'arcade_game_votes',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    gameId: uuid('game_id')
      .notNull()
      .references(() => arcadeGames.id, { onDelete: 'cascade' }),
    votedAt: timestamp('voted_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    uniqueUserGame: unique().on(table.userId, table.gameId),
    userIdIdx: index('arcade_game_votes_user_id_idx').on(table.userId),
    gameIdIdx: index('arcade_game_votes_game_id_idx').on(table.gameId),
  }),
);

export type ArcadeGameVote = InferSelectModel<typeof arcadeGameVotes>;
export type InsertArcadeGameVote = InferInsertModel<typeof arcadeGameVotes>;

// Arcade Game Plays — per game, IP-based dedup (4h window) in app logic
export const arcadeGamePlays = pgTable(
  'arcade_game_plays',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    gameId: uuid('game_id')
      .notNull()
      .references(() => arcadeGames.id, { onDelete: 'cascade' }),
    ipAddress: text('ip_address').notNull(),
    playedAt: timestamp('played_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    gameIdIdx: index('arcade_game_plays_game_id_idx').on(table.gameId),
    gameIpIdx: index('arcade_game_plays_game_ip_idx').on(
      table.gameId,
      table.ipAddress,
    ),
    playedAtIdx: index('arcade_game_plays_played_at_idx').on(table.playedAt),
  }),
);

export type ArcadeGamePlay = InferSelectModel<typeof arcadeGamePlays>;
export type InsertArcadeGamePlay = InferInsertModel<typeof arcadeGamePlays>;

export const timeSlotTargets = [
  'hackers',
  'mentors',
  'sponsors',
  'judges',
] as const;
export type TimeSlotTarget = (typeof timeSlotTargets)[number];
export const timeSlotTargetEnum = pgEnum('time_slot_target', timeSlotTargets);

export const timeSlots = pgTable('time_slots', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  eventId: uuid('event_id')
    .notNull()
    .references(() => events.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  startTime: timestamp('start_time', { withTimezone: true }).notNull(),
  endTime: timestamp('end_time', { withTimezone: true }).notNull(),
  location: text('location'),
  color: text('color').notNull().default('#e1ff00'),
  target: timeSlotTargetEnum('target').array().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type TimeSlot = InferSelectModel<typeof timeSlots>;
export type InsertTimeSlot = InferInsertModel<typeof timeSlots>;

// Better Auth Tables
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  userType: userTypeEnum('user_type').notNull(),
  linkedId: uuid('linked_id'),
  adminRole: adminRoleEnum('admin_role'),
  role: text('role').default('user'),
  banned: boolean('banned').default(false),
  banReason: text('ban_reason'),
  banExpires: timestamp('ban_expires', { withTimezone: true }),
});

export type User = InferSelectModel<typeof user>;
export type InsertUser = InferInsertModel<typeof user>;

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull(),
  impersonatedBy: text('impersonated_by'),
  activeOrganizationId: text('active_organization_id'),
});

export type Session = InferSelectModel<typeof session>;
export type InsertSession = InferInsertModel<typeof session>;

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at', {
    withTimezone: true,
  }),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at', {
    withTimezone: true,
  }),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});

export type Account = InferSelectModel<typeof account>;
export type InsertAccount = InferInsertModel<typeof account>;

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
});

export type Verification = InferSelectModel<typeof verification>;
export type InsertVerification = InferInsertModel<typeof verification>;

export const cronjobs = pgTable('cronjobs', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  jobName: text('job_name').notNull().unique(),
  schedule: text('schedule'),
  enabled: boolean('enabled').notNull().default(true),
  lastRun: timestamp('last_run', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type Cronjob = InferSelectModel<typeof cronjobs>;
export type InsertCronjob = InferInsertModel<typeof cronjobs>;

// Music Bot Tables
export const musicActions = [
  'ADD_SONG',
  'NOW_PLAYING_VIEW',
  'QUEUE_VIEW',
] as const;
export type MusicAction = (typeof musicActions)[number];
export const musicActionEnum = pgEnum('music_action', musicActions);

export const nowPlaying = pgTable('now_playing', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  eventId: uuid('event_id')
    .notNull()
    .references(() => events.id, { onDelete: 'cascade' }),
  trackName: text('track_name').notNull(),
  trackArtists: text('track_artists').notNull(),
  trackUrl: text('track_url').notNull(),
  albumArt: text('album_art'),
  addedByDiscordUsername: text('added_by_discord_username'),
  addedByDiscordId: text('added_by_discord_id'),
  addedByHackerId: uuid('added_by_hacker_id').references(() => hackers.id, {
    onDelete: 'set null',
  }),
  currentVoteScore: integer('current_vote_score').default(0).notNull(),
  discordChannelId: text('discord_channel_id'),
  discordMessageId: text('discord_message_id'),
  playingAt: timestamp('playing_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type NowPlaying = InferSelectModel<typeof nowPlaying>;
export type InsertNowPlaying = InferInsertModel<typeof nowPlaying>;

export const trackHistory = pgTable('track_history', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  eventId: uuid('event_id')
    .notNull()
    .references(() => events.id, { onDelete: 'cascade' }),
  trackName: text('track_name').notNull(),
  trackArtists: text('track_artists').notNull(),
  trackUrl: text('track_url').notNull(),
  albumArt: text('album_art'),
  addedByDiscordUsername: text('added_by_discord_username'),
  addedByDiscordId: text('added_by_discord_id'),
  addedByHackerId: uuid('added_by_hacker_id').references(() => hackers.id, {
    onDelete: 'set null',
  }),
  finalVoteScore: integer('final_vote_score'),
  wasSkipped: boolean('was_skipped').default(false).notNull(),
  playedAt: timestamp('played_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type TrackHistory = InferSelectModel<typeof trackHistory>;
export type InsertTrackHistory = InferInsertModel<typeof trackHistory>;

export const musicActionLogs = pgTable(
  'music_action_logs',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    userId: text('user_id').notNull(),
    username: text('username').notNull(),
    action: musicActionEnum('action').notNull(),
    trackName: text('track_name'),
    trackArtists: text('track_artists'),
    trackUrl: text('track_url'),
    timestamp: timestamp('timestamp', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userIdIdx: index('music_action_logs_user_id_idx').on(table.userId),
    timestampIdx: index('music_action_logs_timestamp_idx').on(table.timestamp),
    actionIdx: index('music_action_logs_action_idx').on(table.action),
  }),
);

export type MusicActionLog = InferSelectModel<typeof musicActionLogs>;
export type InsertMusicActionLog = InferInsertModel<typeof musicActionLogs>;

export const trackVotes = pgTable(
  'track_votes',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    nowPlayingId: uuid('now_playing_id')
      .notNull()
      .references(() => nowPlaying.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull(),
    username: text('username').notNull(),
    voteValue: integer('vote_value').notNull(),
    votedAt: timestamp('voted_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userTrackUnique: unique().on(table.nowPlayingId, table.userId),
    userIdIdx: index('track_votes_user_id_idx').on(table.userId),
    nowPlayingIdIdx: index('track_votes_now_playing_id_idx').on(
      table.nowPlayingId,
    ),
  }),
);

export type TrackVote = InferSelectModel<typeof trackVotes>;
export type InsertTrackVote = InferInsertModel<typeof trackVotes>;

export const personTypes = ['hacker', 'mentor'] as const;
export type PersonType = (typeof personTypes)[number];
export const personTypeEnum = pgEnum('person_type', personTypes);

export const personEntrances = pgTable(
  'person_entrances',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    personType: personTypeEnum('person_type').notNull(),
    hackerId: uuid('hacker_id').references(() => hackers.id, {
      onDelete: 'cascade',
    }),
    mentorId: uuid('mentor_id').references(() => mentors.id, {
      onDelete: 'cascade',
    }),
    enteredAt: timestamp('entered_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    registeredByAdminId: uuid('registered_by_admin_id').references(
      () => admins.id,
      { onDelete: 'set null' },
    ),
  },
  (table) => ({
    hackerEventUnique: unique().on(table.hackerId, table.eventId),
    mentorEventUnique: unique().on(table.mentorId, table.eventId),
    hackerIdIdx: index('person_entrances_hacker_id_idx').on(table.hackerId),
    mentorIdIdx: index('person_entrances_mentor_id_idx').on(table.mentorId),
    eventIdIdx: index('person_entrances_event_id_idx').on(table.eventId),
  }),
);

export type PersonEntrance = InferSelectModel<typeof personEntrances>;
export type InsertPersonEntrance = InferInsertModel<typeof personEntrances>;

export const externalPeople = pgTable(
  'external_people',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    slug: text('slug').notNull(),
    fullName: text('full_name').notNull(),
    category: text('category').notNull(),
    role: text('role'),
    githubUrl: text('github_url'),
    linkedinUrl: text('linkedin_url'),
    redirectUrl: text('redirect_url'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    eventIdIdx: index('external_people_event_id_idx').on(table.eventId),
    eventSlugUnique: unique('external_people_event_id_slug_unique').on(
      table.eventId,
      table.slug,
    ),
  }),
);

export type ExternalPerson = InferSelectModel<typeof externalPeople>;
export type InsertExternalPerson = InferInsertModel<typeof externalPeople>;

export type MentorAvailability = {
  day: 'friday' | 'saturday' | 'sunday';
  startTime: string;
  endTime: string;
  tentative?: boolean;
};

export const mentors = pgTable(
  'mentors',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    fullName: text('full_name').notNull(),
    github: text('github').notNull(),
    linkedin: text('linkedin'),
    pictureUrl: text('picture_url'),
    companyTitle: text('company_title'),
    availability: json('availability').$type<MentorAvailability[]>(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    eventIdIdx: index('mentors_event_id_idx').on(table.eventId),
  }),
);

export type Mentor = InferSelectModel<typeof mentors>;
export type InsertMentor = InferInsertModel<typeof mentors>;

export const presentationUploads = pgTable('presentation_uploads', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  teamId: uuid('team_id')
    .notNull()
    .references(() => teams.id, { onDelete: 'cascade' }),
  slidesUploadedAt: timestamp('slides_uploaded_at', { withTimezone: true }),
  demoUploadedAt: timestamp('demo_uploaded_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type PresentationUpload = InferSelectModel<typeof presentationUploads>;
export type InsertPresentationUpload = InferInsertModel<
  typeof presentationUploads
>;

// Feedback enums
export const participationIntents = ['yes', 'no', 'maybe'] as const;
export type ParticipationIntent = (typeof participationIntents)[number];
export const participationIntentEnum = pgEnum(
  'participation_intent',
  participationIntents,
);

export const sponsorWorkIntents = ['yes', 'no', 'already_did'] as const;
export type SponsorWorkIntent = (typeof sponsorWorkIntents)[number];
export const sponsorWorkIntentEnum = pgEnum(
  'sponsor_work_intent',
  sponsorWorkIntents,
);

export const startupIntents = ['yes', 'no', 'already_building'] as const;
export type StartupIntent = (typeof startupIntents)[number];
export const startupIntentEnum = pgEnum('startup_intent', startupIntents);

export const fundingPreferences = ['bootstrapped', 'vc', 'other'] as const;
export type FundingPreference = (typeof fundingPreferences)[number];
export const fundingPreferenceEnum = pgEnum(
  'funding_preference',
  fundingPreferences,
);

export const startupAmbitions = [
  'up_to_100k',
  '100k_to_1m',
  '1m_to_10m',
  '10m_plus',
  'not_sure',
] as const;
export type StartupAmbition = (typeof startupAmbitions)[number];
export const startupAmbitionEnum = pgEnum('startup_ambition', startupAmbitions);

export const feedbackUsagePermissions = [
  'yes_with_name',
  'yes_anonymous',
  'no',
] as const;
export type FeedbackUsagePermission = (typeof feedbackUsagePermissions)[number];
export const feedbackUsagePermissionEnum = pgEnum(
  'feedback_usage_permission',
  feedbackUsagePermissions,
);

export type EventQualityRatings = {
  oficina: number;
  wifi: number;
  comida: number;
  software: number;
  comunicacion: number;
  branding: number;
  mentores: number;
  jueces: number;
  sponsors: number;
  nivelTecnico: number;
  tracks: number;
  premios: number;
  procesoEvaluacion: number;
  publicVoting: number;
  organizacion: number;
};

export const hackerFeedback = pgTable(
  'hacker_feedback',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    hackerProfileId: uuid('hacker_profile_id')
      .notNull()
      .references(() => hackerProfiles.id, { onDelete: 'cascade' }),
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),

    // Overall experience (Q1-3)
    overallRating: integer('overall_rating').notNull(),
    npsScore: integer('nps_score').notNull(),
    participationIntent: participationIntentEnum(
      'participation_intent',
    ).notNull(),

    // Event quality (Q4)
    eventQualityRatings: json('event_quality_ratings')
      .notNull()
      .$type<EventQualityRatings>(),

    // Improvement (Q5-7)
    bestPart: text('best_part').notNull(),
    worstPart: text('worst_part'),
    suggestions: text('suggestions'),

    // Sponsors (Q8-11)
    sponsorUnaidedRecall: text('sponsor_unaided_recall').notNull(),
    sponsorsInteracted: json('sponsors_interacted').$type<string[]>(),
    sponsorWorkIntent: sponsorWorkIntentEnum('sponsor_work_intent'),
    sponsorComments: text('sponsor_comments'),

    // Future (Q12-14)
    startupIntent: startupIntentEnum('startup_intent').notNull(),
    fundingPreference: fundingPreferenceEnum('funding_preference'),
    startupAmbition: startupAmbitionEnum('startup_ambition'),

    // Extras (Q15-18)
    howHeardAbout: text('how_heard_about'),
    additionalComments: text('additional_comments'),
    mediaUrls: json('media_urls').$type<string[]>(),
    feedbackUsagePermission: feedbackUsagePermissionEnum(
      'feedback_usage_permission',
    ).notNull(),

    // Mentor feedback (optional, only if team had a mentor)
    mentorRating: integer('mentor_rating'),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    hackerEventUnique: unique().on(table.hackerProfileId, table.eventId),
    hackerProfileIdIdx: index('hacker_feedback_hacker_profile_id_idx').on(
      table.hackerProfileId,
    ),
    eventIdIdx: index('hacker_feedback_event_id_idx').on(table.eventId),
  }),
);

export type HackerFeedback = InferSelectModel<typeof hackerFeedback>;
export type InsertHackerFeedback = InferInsertModel<typeof hackerFeedback>;
