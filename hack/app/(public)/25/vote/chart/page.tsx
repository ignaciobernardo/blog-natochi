import {
  getProjectsWithMinVotes,
  getVoteEvolutionForProjects,
} from '@/src/queries/vote-evolution';
import { VoteEvolutionChart } from './_components/vote-evolution-chart';

export const dynamic = 'force-dynamic';

export default async function VoteChartPage() {
  const projects = await getProjectsWithMinVotes(20);
  const projectIds = projects.map((p) => p.id);
  const votes = await getVoteEvolutionForProjects(projectIds);

  return (
    <div className="container mx-auto space-y-8 px-4 py-8">
      <div className="space-y-2">
        <h1 className="font-bold font-title text-4xl text-primary">
          Vote Evolution
        </h1>
        <p className="text-muted-foreground">
          Track how votes accumulated over time for top projects (20+ votes)
        </p>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-lg border border-primary/20 bg-card p-12 text-center">
          <p className="text-muted-foreground">
            No projects with more than 20 votes yet.
          </p>
        </div>
      ) : (
        <VoteEvolutionChart projects={projects} votes={votes} />
      )}
    </div>
  );
}
