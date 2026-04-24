'use client';

import { Badge } from '@/src/components/ui/badge';
import type { MentorWithTeams } from '@/src/queries/mentors';

interface MentorsOverviewProps {
  mentorsWithTeams: MentorWithTeams[];
}

export function MentorsOverview({ mentorsWithTeams }: MentorsOverviewProps) {
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
              Todos los equipos han seleccionado su mentor
            </h2>
          </div>
          <div className="border-primary border-l-4 pl-4">
            <p className="font-title text-primary/70 text-sm sm:text-base">
              Aquí puedes ver todos los mentores y los equipos que los
              seleccionaron
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {mentorsWithTeams.map((mentor) => (
          <div
            key={mentor.id}
            className="border-2 border-primary/50 bg-background/80 p-6 backdrop-blur-sm sm:p-8"
          >
            <div className="space-y-4">
              <div>
                <h3 className="font-bold font-title text-primary text-xl sm:text-2xl">
                  {mentor.fullName}
                </h3>
                {mentor.companyTitle && (
                  <p className="mt-1 text-muted-foreground text-sm">
                    {mentor.companyTitle}
                  </p>
                )}
                {mentor.github && (
                  <p className="mt-1 text-muted-foreground text-xs">
                    {mentor.github.replace(
                      /^https?:\/\/(www\.)?github\.com\//,
                      '',
                    )}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                {mentor.teams.map((team) => (
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
