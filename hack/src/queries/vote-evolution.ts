import { eq, inArray, sql } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import { projects, publicVotes } from '@/src/lib/db/schema';

export interface ProjectVoteData {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  voteCount: number;
}

export interface VoteTimestamp {
  projectId: string;
  projectName: string;
  slug: string;
  logoUrl: string | null;
  votedAt: Date;
}

export async function getProjectsWithMinVotes(minVotes: number = 20) {
  const result = await db
    .select({
      id: projects.id,
      name: projects.name,
      slug: projects.slug,
      logoUrl: projects.logoUrl,
      voteCount: sql<number>`count(${publicVotes.id})::int`,
    })
    .from(projects)
    .leftJoin(publicVotes, eq(projects.id, publicVotes.projectId))
    .groupBy(projects.id, projects.name, projects.slug, projects.logoUrl)
    .having(sql`count(${publicVotes.id}) > ${minVotes}`)
    .orderBy(sql`count(${publicVotes.id}) DESC`);

  return result as ProjectVoteData[];
}

export async function getVoteEvolutionForProjects(projectIds: string[]) {
  if (projectIds.length === 0) return [];

  const result = await db
    .select({
      projectId: publicVotes.projectId,
      projectName: projects.name,
      slug: projects.slug,
      logoUrl: projects.logoUrl,
      votedAt: publicVotes.votedAt,
    })
    .from(publicVotes)
    .innerJoin(projects, eq(publicVotes.projectId, projects.id))
    .where(inArray(publicVotes.projectId, projectIds))
    .orderBy(publicVotes.votedAt);

  return result as VoteTimestamp[];
}
