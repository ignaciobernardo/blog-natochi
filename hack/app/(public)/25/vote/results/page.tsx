import { Trophy } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getProjectsRankedByVotes } from '@/src/queries/projects';
import { ContinuousConfetti } from './_components/continuous-confetti';

const DEFAULT_LOGO_HASH = process.env.DEFAULT_LOGO_HASH || '';

export const metadata: Metadata = {
  title: 'Platanus Hack 25 | Ganadores',
  description:
    'Los proyectos ganadores de Platanus Hack 25 por votacion popular',
};

function getInitials(name: string): string {
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.charAt(0).toUpperCase();
}

function isDefaultLogo(logoHash: string | null): boolean {
  if (!logoHash || !DEFAULT_LOGO_HASH) return false;
  return logoHash.toLowerCase() === DEFAULT_LOGO_HASH.toLowerCase();
}

export default async function WinnersPage() {
  const projects = await getProjectsRankedByVotes();

  const projectsWithRanks = projects.map((project) => {
    const rank =
      projects.filter((p) => p.voteCount > project.voteCount).length + 1;
    return { ...project, rank };
  });

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <ContinuousConfetti />

      <div className="mb-8 flex flex-col items-center gap-4">
        <div className="flex items-center gap-3">
          <Trophy className="h-10 w-10 text-primary" />
          <h1 className="font-bold font-title text-3xl text-primary sm:text-4xl">
            Resultados Votación Pública
          </h1>
          <Trophy className="h-10 w-10 text-primary" />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {projectsWithRanks.map((project) => {
          const { rank } = project;
          const isTop3 = rank <= 3;

          return (
            <Link
              key={project.id}
              href={`/25/vote/${project.slug}`}
              className={`group flex items-center gap-4 border-2 bg-background p-4 transition-all hover:border-primary hover:shadow-lg ${
                isTop3 ? 'border-primary/40' : 'border-primary/20'
              }`}
            >
              {/* Rank */}
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center font-bold font-title ${
                  rank === 1
                    ? 'bg-yellow-400 text-black'
                    : rank === 2
                      ? 'bg-gray-400 text-black'
                      : rank === 3
                        ? 'bg-amber-600 text-black'
                        : 'bg-primary/10 text-primary'
                }`}
              >
                {rank}
              </div>

              {/* Logo */}
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border-2 border-primary/20 bg-primary/5 sm:h-16 sm:w-16">
                {project.logoUrl && !isDefaultLogo(project.logoHash) ? (
                  <Image
                    src={project.logoUrl}
                    alt={project.name}
                    width={64}
                    height={64}
                    className="h-full w-full object-contain p-1"
                  />
                ) : (
                  <span className="font-bold font-title text-primary text-xl">
                    {getInitials(project.name)}
                  </span>
                )}
              </div>

              {/* Title and Oneliner */}
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <h2 className="font-bold font-title text-lg text-primary sm:text-xl">
                  {project.name}
                </h2>
                {project.onelinerShort && (
                  <p className="line-clamp-1 text-muted-foreground text-sm">
                    {project.onelinerShort}
                  </p>
                )}
                {project.trackName && (
                  <span className="inline-block w-fit bg-primary/10 px-2 py-0.5 font-title text-primary text-xs">
                    {project.trackName}
                  </span>
                )}
              </div>

              {/* Vote Count */}
              <div className="flex shrink-0 flex-col items-end">
                <span
                  className={`font-bold font-title text-2xl sm:text-3xl ${
                    isTop3 ? 'text-primary' : 'text-primary/70'
                  }`}
                >
                  {project.voteCount}
                </span>
                <span className="text-muted-foreground text-xs">votos</span>
              </div>
            </Link>
          );
        })}
      </div>

      {projects.length === 0 && (
        <div className="flex min-h-[400px] items-center justify-center">
          <p className="font-title text-2xl text-primary/60">
            No hay proyectos aun.
          </p>
        </div>
      )}
    </div>
  );
}
