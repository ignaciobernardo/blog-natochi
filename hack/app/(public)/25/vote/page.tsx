import { Check, Trophy } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/src/components/ui/button';
import { getSession } from '@/src/lib/auth/server';
import { getDefaultEvent } from '@/src/queries/events';
import { getPublicProjects } from '@/src/queries/projects';
import { VotingDeadlineBanner } from './_components/voting-deadline-banner';

const DEFAULT_LOGO_HASH = process.env.DEFAULT_LOGO_HASH || '';

export const metadata: Metadata = {
  title: 'Platanus Hack 25 Voting | Vota hasta el 6 de enero 23:59',
  description:
    'Platanus Hack 25 Voting: Revisa todos los proyectos de la mejor hackatón de latinoamérica y vota por tu favorito',
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

export default async function VotePage() {
  const session = await getSession();
  const projects = await getPublicProjects(session?.user?.id);
  const event = await getDefaultEvent();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <VotingDeadlineBanner
        votingStartsAt={event?.votingStartsAt ?? null}
        votingEndsAt={event?.votingEndsAt ?? null}
      />
      <div className="mb-6 flex justify-center">
        <Button
          asChild
          variant="outline"
          size="lg"
          className="animate-button-breathe gap-2 border-2 border-primary px-8 py-6 text-lg hover:text-primary"
        >
          <Link href="/25/vote/results">
            <Trophy className="h-5 w-5" />
            ver los ganadores
          </Link>
        </Button>
      </div>
      {projects.length === 0 ? (
        <div className="flex min-h-[400px] items-center justify-center">
          <p className="font-title text-2xl text-primary/60">
            No hay proyectos disponibles para votar aún.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/25/vote/${project.slug}` as any}
              className="group relative flex flex-col overflow-hidden border-2 border-primary/20 bg-background transition-all hover:border-primary hover:shadow-lg"
            >
              {/* Voted Checkmark */}
              {project.hasVoted && (
                <div className="absolute top-2 right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-background">
                  <Check className="h-4 w-4" />
                </div>
              )}

              {/* Logo */}
              <div className="relative flex h-48 items-center justify-center bg-primary/5 p-6">
                {project.logoUrl && !isDefaultLogo(project.logoHash) ? (
                  <Image
                    src={project.logoUrl}
                    alt={project.name}
                    width={200}
                    height={200}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="flex h-32 w-32 items-center justify-center rounded-full bg-primary/10">
                    <span className="font-bold font-title text-4xl text-primary">
                      {getInitials(project.name)}
                    </span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex flex-1 flex-col gap-2 p-4">
                <h3 className="font-bold font-title text-primary text-xl">
                  {project.name}
                </h3>

                {project.trackName && (
                  <span className="inline-block w-fit bg-primary/10 px-2 py-1 font-title text-primary text-sm">
                    {project.trackName}
                  </span>
                )}
              </div>

              {/* Hover effect */}
              <div className="absolute inset-0 bg-primary opacity-0 transition-opacity group-hover:opacity-5" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
