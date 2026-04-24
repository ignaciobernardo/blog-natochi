import { formatDistanceToNow } from 'date-fns';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/src/components/ui/avatar';
import { Badge } from '@/src/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import type { Hacker, Rsvp } from '@/src/lib/db/schema';

interface TeamRsvpsProps {
  rsvps: Array<Rsvp & { hacker: Hacker }>;
}

const getInitials = (name: string) => {
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const getGitHubAvatarUrl = (githubUsername: string | null) => {
  if (!githubUsername) return null;
  const username = githubUsername.replace(
    /^https?:\/\/(www\.)?github\.com\//,
    '',
  );
  return `https://github.com/${username}.png`;
};

const statusIcons = {
  confirmed: CheckCircle2,
  declined: XCircle,
  pending: Clock,
};

const statusColors = {
  confirmed: 'bg-green-100 text-green-800 border-green-300',
  declined: 'bg-red-100 text-red-800 border-red-300',
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
};

export function TeamRsvps({ rsvps }: TeamRsvpsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>RSVPs ({rsvps.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {rsvps.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            No RSVPs yet
          </div>
        ) : (
          <div className="space-y-3">
            {rsvps.map((rsvp) => {
              const StatusIcon = statusIcons[rsvp.status];
              return (
                <div
                  key={rsvp.id}
                  className="flex items-start gap-3 rounded-lg border bg-card p-3"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={getGitHubAvatarUrl(rsvp.hacker.github) || undefined}
                      alt={rsvp.hacker.fullName}
                    />
                    <AvatarFallback className="text-xs">
                      {getInitials(rsvp.hacker.fullName)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium text-sm">
                        {rsvp.hacker.fullName}
                      </div>
                      <Badge
                        variant="outline"
                        className={statusColors[rsvp.status]}
                      >
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {rsvp.status}
                      </Badge>
                    </div>

                    {rsvp.confirmedAt && (
                      <div className="text-muted-foreground text-xs">
                        Confirmed{' '}
                        {formatDistanceToNow(new Date(rsvp.confirmedAt), {
                          addSuffix: true,
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
