import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { getDashboardStats } from '@/src/queries/dashboard';

interface StatsCardsProps {
  eventId: string;
}

export async function StatsCards({ eventId }: StatsCardsProps) {
  const stats = await getDashboardStats(eventId);

  const _statusLabels: Record<string, string> = {
    received: 'Received',
    screening: 'Screening',
    maybe: 'Maybe',
    approved: 'Approved',
    rsvp_open: 'RSVP Open',
    rsvp_confirmed: 'RSVP Confirmed',
    rsvp_expired: 'RSVP Expired',
    rejected: 'Rejected',
    withdrawn: 'Withdrawn',
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Total Applicants</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="font-bold text-2xl">{stats.totalApplicants}</div>
          <p className="text-muted-foreground text-xs">
            People who have applied
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Solo Participants</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="font-bold text-2xl">{stats.soloParticipants}</div>
          <p className="text-muted-foreground text-xs">People in solo mode</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Looking for Team</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="font-bold text-2xl">
            {stats.teamLookingParticipants}
          </div>
          <p className="text-muted-foreground text-xs">
            People looking for teammates
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>In Teams</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="font-bold text-2xl">{stats.teamParticipants}</div>
          <p className="text-muted-foreground text-xs">
            People in team submissions
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>New Applicants</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <div className="font-bold text-2xl">
              {stats.newApplicantsPercent}%
            </div>
            <div className="text-muted-foreground text-sm">
              ({stats.newApplicantsCount})
            </div>
          </div>
          <p className="text-muted-foreground text-xs">
            Not from Platanus Hack 24
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Women Applicants</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="font-bold text-2xl">{stats.womenPercent}%</div>
          <p className="text-muted-foreground text-xs">
            {stats.womenCount} women have applied
          </p>
        </CardContent>
      </Card>
    </>
  );
}
