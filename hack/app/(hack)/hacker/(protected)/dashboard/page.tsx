import { redirect } from 'next/navigation';
import { onlyAuthenticated } from '@/src/lib/auth/server';
import { getDefaultEvent } from '@/src/queries/events';
import { getHackerDashboardData } from '@/src/queries/hackers';
import { EventLocationCard } from './_components/event-location-card';
import { HackathonCountdown } from './_components/hackathon-countdown';

function extractGithubUsername(github: string | null): string {
  if (!github) return '';

  if (github.includes('github.com')) {
    const parts = github.split('/');
    return parts[parts.length - 1] || github;
  }

  return github;
}

export default async function HackerDashboardPage() {
  const session = await onlyAuthenticated();

  if (!session.user.linkedId) {
    redirect('/login?error=no_hacker_linked');
  }

  const dashboardData = await getHackerDashboardData(session.user.linkedId);
  const event = await getDefaultEvent();

  if (!dashboardData) {
    redirect('/login?error=no_dashboard_data');
  }

  if (!event) {
    redirect('/login?error=no_event');
  }

  const githubUsername = extractGithubUsername(dashboardData.hacker.github);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="mx-auto w-full max-w-4xl space-y-8">
          <div className="text-center">
            <h1 className="inline-block font-bold font-title text-2xl text-primary sm:text-3xl md:text-4xl">
              Bienvenid@ a{' '}
              <span className="bg-primary px-2 py-1 text-background">
                Platanus Hack
              </span>
              ,{' '}
              <span className="bg-primary px-2 py-1 text-background">
                {githubUsername || dashboardData.hacker.fullName.split(' ')[0]}
              </span>
            </h1>
          </div>

          {event.startsAt && new Date() < new Date(event.startsAt) && (
            <HackathonCountdown
              startsAt={event.startsAt}
              eventName={event.name}
            />
          )}

          <div className="border-2 border-primary bg-background/80 p-6 backdrop-blur-sm sm:p-8 md:p-10">
            <div className="space-y-6">
              <div className="border-primary/20 border-b pb-4">
                <h2 className="font-bold font-title text-2xl text-primary sm:text-3xl md:text-4xl">
                  TU INFORMACIÓN
                </h2>
              </div>

              <div className="space-y-4">
                <div className="border-primary border-l-4 pl-4">
                  <h3 className="font-bold font-title text-primary/70 text-sm uppercase">
                    Nombre Completo
                  </h3>
                  <p className="font-bold font-title text-lg text-primary sm:text-xl">
                    {dashboardData.hacker.fullName}
                  </p>
                </div>

                {dashboardData.hacker.github && (
                  <div className="border-primary border-l-4 pl-4">
                    <h3 className="font-bold font-title text-primary/70 text-sm uppercase">
                      GitHub
                    </h3>
                    <a
                      href={
                        dashboardData.hacker.github.startsWith('http')
                          ? dashboardData.hacker.github
                          : `https://github.com/${dashboardData.hacker.github}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-primary text-sm transition-colors hover:underline sm:text-base"
                    >
                      {githubUsername}
                    </a>
                  </div>
                )}

                {dashboardData.hackerProfile?.discordUsername && (
                  <div className="border-primary border-l-4 pl-4">
                    <h3 className="font-bold font-title text-primary/70 text-sm uppercase">
                      Discord
                    </h3>
                    <p className="font-mono text-primary text-sm sm:text-base">
                      {dashboardData.hackerProfile.discordUsername}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {dashboardData.team && (
            <div className="border-2 border-primary bg-background/80 p-6 backdrop-blur-sm sm:p-8 md:p-10">
              <div className="text-center">
                <h2 className="mb-2 font-bold font-title text-primary/70 text-sm uppercase tracking-wide">
                  Tu Equipo
                </h2>
                <div className="inline-block bg-primary px-6 py-3">
                  <p className="font-bold font-title text-3xl text-background sm:text-4xl md:text-5xl">
                    {dashboardData.team.slug}
                  </p>
                </div>
                {dashboardData.team.tableNumber && (
                  <p className="mt-4 font-title text-primary/70 text-sm">
                    Mesa:{' '}
                    <span className="bg-primary px-2 py-1 font-bold text-background">
                      {dashboardData.team.tableNumber}
                    </span>
                  </p>
                )}
                {dashboardData.team.track && (
                  <p className="mt-4 font-title text-primary/70 text-sm">
                    Track:{' '}
                    <span className="bg-primary px-2 py-1 font-bold text-background">
                      {dashboardData.team.track.name}
                    </span>
                  </p>
                )}
                {dashboardData.team.mentor && (
                  <p className="mt-4 font-title text-primary/70 text-sm">
                    Mentor:{' '}
                    <span className="bg-primary px-2 py-1 font-bold text-background">
                      {dashboardData.team.mentor.fullName}
                    </span>
                  </p>
                )}
              </div>

              <div className="mt-8 space-y-4">
                <h3 className="font-bold font-title text-primary/70 text-sm uppercase tracking-wide">
                  Miembros
                </h3>
                <div className="space-y-3">
                  {dashboardData.team.members
                    .sort((a, b) => a.fullName.localeCompare(b.fullName))
                    .map((member) => (
                      <div
                        key={member.id}
                        className="flex flex-col gap-1 border-primary border-l-4 pl-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <h4 className="font-bold font-title text-lg text-primary sm:text-xl">
                            {member.fullName}
                            {member.id === dashboardData.hacker.id && (
                              <span className="ml-2 font-title text-primary/70 text-sm">
                                (tú)
                              </span>
                            )}
                          </h4>
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
              </div>
            </div>
          )}

          <EventLocationCard eventName={event.name} />
        </div>
      </div>
    </div>
  );
}
