import { notFound } from 'next/navigation';
import { getHackerStatusByPublicId } from '@/src/queries/hackers';
import { ConfettiEffect } from './_components/confetti-effect';
import { SeleccionadoGraphic } from './_components/seleccionado-graphic';

function extractGithubUsername(github: string | null): string {
  if (!github) return '';

  if (github.includes('github.com')) {
    const parts = github.split('/');
    return parts[parts.length - 1] || github;
  }

  return github;
}

export default async function HackerStatusPage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;
  const statusData = await getHackerStatusByPublicId(publicId);

  if (!statusData) {
    notFound();
  }

  const allowedStatuses = [
    'approved',
    'onboarding_request',
    'onboarding_complete',
  ];

  if (!allowedStatuses.includes(statusData.submission.status)) {
    notFound();
  }

  const githubUsername =
    extractGithubUsername(statusData.hacker.github) ||
    statusData.hacker.fullName;

  const isSoloOrLooking =
    statusData.submission.modality === 'solo' ||
    statusData.submission.modality === 'team_looking';
  const headerText = isSoloOrLooking ? 'TU POSTULACIÓN' : 'TU EQUIPO';

  return (
    <>
      <ConfettiEffect />
      <div className="min-h-screen bg-background">
        <div className="container relative mx-auto px-4 py-12 md:py-16">
          {/* Platanus logo in top right */}
          <div className="absolute top-4 right-4 z-20 sm:top-6 sm:right-6 md:top-8 md:right-8">
            <div
              className="aspect-[576/112] h-7 w-auto sm:h-9 md:h-10"
              style={{
                backgroundColor: 'hsl(var(--primary))',
                maskImage: 'url(/assets/logos/platanus.svg)',
                maskSize: 'contain',
                maskRepeat: 'no-repeat',
                maskPosition: 'center',
                WebkitMaskImage: 'url(/assets/logos/platanus.svg)',
                WebkitMaskSize: 'contain',
                WebkitMaskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center',
              }}
            />
          </div>

          {/* Main content */}
          <div className="mx-auto w-full max-w-4xl space-y-8">
            {/* Title */}
            <div className="text-center">
              <h1 className="inline-block font-bold font-title text-2xl text-primary sm:text-3xl md:text-4xl">
                Bienvenid@ a{' '}
                <span className="bg-primary px-2 py-1 text-background">
                  Platanus Hack
                </span>
                ,{' '}
                <span className="bg-primary px-2 py-1 text-background">
                  {githubUsername}
                </span>
              </h1>
            </div>

            {/* Team Card */}
            <div className="border-2 border-primary bg-background/80 p-6 backdrop-blur-sm sm:p-8 md:p-10">
              <div className="space-y-6">
                {/* Team Header */}
                <div className="border-primary/20 border-b pb-4">
                  <h2 className="font-bold font-title text-2xl text-primary sm:text-3xl md:text-4xl">
                    {headerText}
                  </h2>
                  <p className="mt-2 font-mono text-primary/70 text-sm">
                    Status:{' '}
                    <span className="bg-primary px-2 py-1 font-bold text-background uppercase">
                      {statusData.submission.status.replace(/_/g, ' ')}
                    </span>
                  </p>
                </div>

                {/* Team Members */}
                <div className="space-y-4">
                  {statusData.teamMembers
                    .sort((a, b) => a.fullName.localeCompare(b.fullName))
                    .map((member) => (
                      <div
                        key={member.id}
                        className="flex flex-col gap-2 border-primary border-l-4 pl-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <h3 className="font-bold font-title text-lg text-primary sm:text-xl">
                            {member.fullName}
                          </h3>
                          {member.github && (
                            <a
                              href={
                                member.github.startsWith('http')
                                  ? member.github
                                  : `https://github.com/${member.github}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-mono text-primary/70 text-sm transition-colors hover:text-primary hover:underline"
                            >
                              {extractGithubUsername(member.github)}
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                </div>

                {/* Event Info */}
                <div className="border-primary/20 border-t pt-6">
                  <div className="space-y-2">
                    <p className="font-bold font-title text-lg text-primary">
                      📅 21-23 de Noviembre, 2025
                    </p>
                    <p className="font-bold font-title text-lg text-primary">
                      📍 Santiago, Chile
                    </p>
                  </div>
                </div>

                {/* Next Steps */}
                <div className="rounded bg-primary/10 p-4">
                  <h3 className="mb-2 font-bold font-title text-primary">
                    Próximos pasos
                  </h3>
                  <p className="font-mono text-primary/80 text-sm">
                    Recibirás un email con más información sobre cómo confirmar
                    tu asistencia al evento.
                  </p>
                </div>
              </div>
            </div>

            {/* Seleccionado Graphic */}
            <div className="flex items-center justify-center">
              <SeleccionadoGraphic
                fullName={statusData.hacker.fullName}
                githubUsername={githubUsername}
              />
            </div>

            {/* Back to home */}
            <div className="text-center">
              <a
                href="/25"
                className="inline-block border-2 border-primary bg-background px-6 py-3 font-bold font-title text-primary transition-all hover:bg-primary/10"
              >
                Volver al inicio
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
