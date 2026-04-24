import {
  and,
  asc,
  eq,
  ilike,
  inArray,
  isNotNull,
  isNull,
  or,
  sql,
} from 'drizzle-orm';
import { db } from '@/src/lib/db';
import {
  hackerProfiles,
  hackers,
  type InsertProject,
  type Project,
  projects,
  publicVotes,
  teams,
  tracks,
} from '@/src/lib/db/schema';
import { generateUniqueSlug } from '@/src/lib/utils/slugify';

export async function getPublicProjects(userId?: string | null) {
  const projectsData = await db
    .select({
      id: projects.id,
      slug: projects.slug,
      name: projects.name,
      logoUrl: projects.logoUrl,
      logoHash: projects.logoHash,
      onelinerShort: projects.onelinerShort,
      description: projects.description,
      videoUrl: projects.videoUrl,
      videoStartAt: projects.videoStartAt,
      videoEndAt: projects.videoEndAt,
      repoUrl: projects.repoUrl,
      teamSlug: teams.slug,
      trackName: tracks.name,
    })
    .from(projects)
    .innerJoin(teams, eq(projects.teamId, teams.id))
    .leftJoin(tracks, eq(teams.trackId, tracks.id))
    .where(and(isNotNull(projects.videoUrl), isNotNull(projects.videoStartAt)))
    .orderBy(asc(sql`lower(${projects.name})`));

  // If user is logged in, check which projects they've voted for
  if (userId && projectsData.length > 0) {
    const projectIds = projectsData.map((p) => p.id);
    const userVotes = await db
      .select({ projectId: publicVotes.projectId })
      .from(publicVotes)
      .where(
        and(
          eq(publicVotes.userId, userId),
          inArray(publicVotes.projectId, projectIds),
        ),
      );

    const votedProjectIds = new Set(userVotes.map((v) => v.projectId));

    return projectsData.map((project) => ({
      ...project,
      hasVoted: votedProjectIds.has(project.id),
    }));
  }

  return projectsData.map((project) => ({
    ...project,
    hasVoted: false,
  }));
}

export type PublicProject = Awaited<
  ReturnType<typeof getPublicProjects>
>[number];

export async function getProjectBySlug(slug: string, userId?: string | null) {
  const project = await db
    .select({
      id: projects.id,
      slug: projects.slug,
      name: projects.name,
      oneliner: projects.oneliner,
      onelinerShort: projects.onelinerShort,
      logoUrl: projects.logoUrl,
      logoHash: projects.logoHash,
      description: projects.description,
      videoUrl: projects.videoUrl,
      videoStartAt: projects.videoStartAt,
      videoEndAt: projects.videoEndAt,
      repoUrl: projects.repoUrl,
      deployUrl: projects.deployUrl,
      teamId: projects.teamId,
      teamSlug: teams.slug,
      trackName: tracks.name,
    })
    .from(projects)
    .innerJoin(teams, eq(projects.teamId, teams.id))
    .leftJoin(tracks, eq(teams.trackId, tracks.id))
    .where(and(eq(projects.slug, slug), isNotNull(projects.videoUrl)))
    .limit(1);

  if (project.length === 0) {
    return null;
  }

  const projectData = project[0];

  // Get vote count
  const voteCountResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(publicVotes)
    .where(eq(publicVotes.projectId, projectData.id));

  const voteCount = voteCountResult[0]?.count ?? 0;

  // Check if user has voted
  let hasVoted = false;
  if (userId) {
    const userVote = await db
      .select()
      .from(publicVotes)
      .where(
        and(
          eq(publicVotes.projectId, projectData.id),
          eq(publicVotes.userId, userId),
        ),
      )
      .limit(1);
    hasVoted = userVote.length > 0;
  }

  // Get team members via hackerProfiles.teamId
  const members = await db
    .select({
      id: hackers.id,
      fullName: hackers.fullName,
      github: hackers.github,
      linkedin: hackers.linkedin,
    })
    .from(hackerProfiles)
    .innerJoin(hackers, eq(hackerProfiles.hackerId, hackers.id))
    .where(eq(hackerProfiles.teamId, projectData.teamId));

  return {
    ...projectData,
    voteCount,
    hasVoted,
    members,
  };
}

export type ProjectDetail = Exclude<
  Awaited<ReturnType<typeof getProjectBySlug>>,
  null
>;

export async function getProjectByTeamId(
  teamId: string,
): Promise<Project | null> {
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.teamId, teamId))
    .limit(1);
  return project || null;
}

export async function upsertProject(data: InsertProject): Promise<Project> {
  const existing = await getProjectByTeamId(data.teamId);

  if (!existing) {
    // Generate slug if not provided
    let slug = data.slug;
    if (!slug) {
      slug = await generateUniqueSlug(
        data.name,
        async (candidateSlug: string) => {
          const existingProject = await db.query.projects.findFirst({
            where: eq(projects.slug, candidateSlug),
          });
          return !existingProject;
        },
      );
    }

    const [project] = await db
      .insert(projects)
      .values({ ...data, slug })
      .returning();
    return project;
  }

  // Update existing project
  const updates: Partial<InsertProject> = {
    name: data.name,
    oneliner: data.oneliner,
    description: data.description,
    logoUrl: data.logoUrl,
    logoHash: data.logoHash,
    deployUrl: data.deployUrl,
    repoUrl: data.repoUrl,
    videoUrl: data.videoUrl,
    videoStartAt: data.videoStartAt,
    videoEndAt: data.videoEndAt,
    updatedAt: new Date(),
  };

  const [updated] = await db
    .update(projects)
    .set(updates)
    .where(eq(projects.id, existing.id))
    .returning();

  return updated;
}

export async function getProjectById(id: string): Promise<Project | null> {
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, id))
    .limit(1);
  return project || null;
}

export async function getProjectsRankedByVotes() {
  const projectsData = await db
    .select({
      id: projects.id,
      slug: projects.slug,
      name: projects.name,
      logoUrl: projects.logoUrl,
      logoHash: projects.logoHash,
      onelinerShort: projects.onelinerShort,
      trackName: tracks.name,
      voteCount: sql<number>`count(${publicVotes.id})::int`,
    })
    .from(projects)
    .innerJoin(teams, eq(projects.teamId, teams.id))
    .leftJoin(tracks, eq(teams.trackId, tracks.id))
    .leftJoin(publicVotes, eq(publicVotes.projectId, projects.id))
    .where(and(isNotNull(projects.videoUrl), isNotNull(projects.videoStartAt)))
    .groupBy(projects.id, teams.id, tracks.name)
    .orderBy(sql`count(${publicVotes.id}) desc`);

  return projectsData;
}

export type RankedProject = Awaited<
  ReturnType<typeof getProjectsRankedByVotes>
>[number];

export async function getProjectsForAdmin({
  eventId,
  page = 1,
  limit = 20,
  search,
  hasVideo,
  hasRepo,
  sortBy = 'createdAt',
  sortOrder = 'desc',
}: {
  eventId: string;
  page?: number;
  limit?: number;
  search?: string;
  hasVideo?: boolean;
  hasRepo?: boolean;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}): Promise<{
  projects: Array<
    Project & {
      team: {
        id: string;
        slug: string;
        trackId: string | null;
      } | null;
      track: {
        id: string;
        name: string;
      } | null;
      memberCount: number;
    }
  >;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> {
  const conditions = [];

  conditions.push(eq(teams.eventId, eventId));

  if (search) {
    conditions.push(
      or(
        ilike(projects.name, `%${search}%`),
        ilike(projects.description, `%${search}%`),
        ilike(projects.slug, `%${search}%`),
      ),
    );
  }

  if (hasVideo !== undefined) {
    conditions.push(
      hasVideo ? isNotNull(projects.videoUrl) : isNull(projects.videoUrl),
    );
  }

  if (hasRepo !== undefined) {
    conditions.push(
      hasRepo ? isNotNull(projects.repoUrl) : isNull(projects.repoUrl),
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(projects)
    .innerJoin(teams, eq(projects.teamId, teams.id))
    .where(whereClause);

  const total = totalResult?.count || 0;
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;

  let orderByClause:
    | typeof projects.name
    | typeof projects.updatedAt
    | typeof projects.createdAt
    | ReturnType<typeof sql>;

  if (sortBy === 'name') {
    orderByClause =
      sortOrder === 'desc' ? sql`${projects.name} desc` : projects.name;
  } else if (sortBy === 'updatedAt') {
    orderByClause =
      sortOrder === 'desc'
        ? sql`${projects.updatedAt} desc`
        : projects.updatedAt;
  } else {
    orderByClause =
      sortOrder === 'desc'
        ? sql`${projects.createdAt} desc`
        : projects.createdAt;
  }

  const projectsData = await db
    .select({
      id: projects.id,
      slug: projects.slug,
      teamId: projects.teamId,
      name: projects.name,
      oneliner: projects.oneliner,
      onelinerShort: projects.onelinerShort,
      description: projects.description,
      logoUrl: projects.logoUrl,
      logoHash: projects.logoHash,
      repoUrl: projects.repoUrl,
      videoUrl: projects.videoUrl,
      videoStartAt: projects.videoStartAt,
      videoEndAt: projects.videoEndAt,
      sourceHasSlides: projects.sourceHasSlides,
      sourceHasDemo: projects.sourceHasDemo,
      slidesUrl: projects.slidesUrl,
      deployUrl: projects.deployUrl,
      slidesMap: projects.slidesMap,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
      teamSlug: teams.slug,
      teamTrackId: teams.trackId,
      trackId: tracks.id,
      trackName: tracks.name,
      memberCount: sql<number>`count(distinct ${hackerProfiles.id})::int`,
    })
    .from(projects)
    .innerJoin(teams, eq(projects.teamId, teams.id))
    .leftJoin(tracks, eq(teams.trackId, tracks.id))
    .leftJoin(hackerProfiles, eq(hackerProfiles.teamId, teams.id))
    .where(whereClause)
    .groupBy(
      projects.id,
      teams.id,
      teams.slug,
      teams.trackId,
      tracks.id,
      tracks.name,
    )
    .orderBy(orderByClause)
    .limit(limit)
    .offset(offset);

  const formattedProjects = projectsData.map((p) => ({
    id: p.id,
    slug: p.slug,
    teamId: p.teamId,
    name: p.name,
    oneliner: p.oneliner,
    onelinerShort: p.onelinerShort,
    description: p.description,
    logoUrl: p.logoUrl,
    logoHash: p.logoHash,
    repoUrl: p.repoUrl,
    videoUrl: p.videoUrl,
    videoStartAt: p.videoStartAt,
    videoEndAt: p.videoEndAt,
    sourceHasSlides: p.sourceHasSlides,
    sourceHasDemo: p.sourceHasDemo,
    slidesUrl: p.slidesUrl,
    deployUrl: p.deployUrl,
    slidesMap: p.slidesMap,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    team: p.teamSlug
      ? {
          id: p.teamId,
          slug: p.teamSlug,
          trackId: p.teamTrackId,
        }
      : null,
    track:
      p.trackId && p.trackName
        ? {
            id: p.trackId,
            name: p.trackName,
          }
        : null,
    memberCount: p.memberCount,
  }));

  return {
    projects: formattedProjects,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}
