'use client';

import { Badge } from '@/src/components/ui/badge';
import type { TrackWithTeams } from '@/src/queries/tracks';

interface TracksOverviewProps {
  tracksWithTeams: TrackWithTeams[];
}

export function TracksOverview({ tracksWithTeams }: TracksOverviewProps) {
  const getGithubUsername = (url: string | null) => {
    if (!url) return null;
    return url
      .replace(/^https?:\/\/(www\.)?github\.com\//, '')
      .replace(/\/$/, '');
  };

  return (
    <div className="space-y-6">
      <div className="border-2 border-primary bg-background/80 p-6 backdrop-blur-sm sm:p-8">
        <div className="space-y-4">
          <div className="border-primary/20 border-b pb-4">
            <h2 className="font-bold font-title text-2xl text-primary sm:text-3xl">
              Todos los equipos han seleccionado su track
            </h2>
          </div>
          <div className="border-primary border-l-4 pl-4">
            <p className="font-title text-primary/70 text-sm sm:text-base">
              Aquí puedes ver todos los tracks y los equipos que los
              seleccionaron
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {tracksWithTeams.map((track) => (
          <div
            key={track.id}
            className="border-2 border-primary/50 bg-background/80 p-6 backdrop-blur-sm sm:p-8"
          >
            <div className="space-y-4">
              <div>
                <h3 className="font-bold font-title text-primary text-xl sm:text-2xl">
                  {track.name}
                </h3>
                {track.description && (
                  <p className="mt-1 text-muted-foreground text-sm">
                    {track.description}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                {track.teams.map((team) => (
                  <div
                    key={team.id}
                    className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/20 bg-background/50 p-3"
                  >
                    <span className="font-medium">{team.slug}</span>
                    <span className="text-muted-foreground">•</span>
                    <div className="flex flex-wrap items-center gap-2">
                      {team.members
                        .filter((member) => member.github)
                        .map((member) => {
                          const username = getGithubUsername(member.github);
                          return username ? (
                            <Badge
                              key={member.id}
                              variant="secondary"
                              className="font-mono text-xs"
                            >
                              @{username}
                            </Badge>
                          ) : null;
                        })}
                      {team.members.filter((member) => member.github).length ===
                        0 && (
                        <span className="text-muted-foreground text-xs">
                          Sin GitHub
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
