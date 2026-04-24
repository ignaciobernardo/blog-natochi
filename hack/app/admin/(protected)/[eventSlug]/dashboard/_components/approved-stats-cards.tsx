import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { getApprovedHackersStats } from '@/src/queries/dashboard';

interface ApprovedStatsCardsProps {
  eventId: string;
}

export async function ApprovedStatsCards({ eventId }: ApprovedStatsCardsProps) {
  const stats = await getApprovedHackersStats(eventId);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Approved Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="font-bold text-2xl">{stats.totalApproved}</div>
          <p className="text-muted-foreground text-xs">
            Total approved applications
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Approved Hackers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="font-bold text-2xl">{stats.totalApprovedHackers}</div>
          <p className="text-muted-foreground text-xs">
            Unique people approved
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Process Completion</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-baseline gap-2">
              <div className="font-bold text-2xl">{stats.acceptanceRate}%</div>
              {stats.capacityHackers && (
                <div className="text-muted-foreground text-sm">
                  of {stats.capacityHackers}
                </div>
              )}
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${Math.min(stats.acceptanceRate, 100)}%` }}
              />
            </div>
            <p className="text-muted-foreground text-xs">
              {stats.capacityHackers
                ? `${stats.totalApprovedHackers} / ${stats.capacityHackers} capacity`
                : 'No capacity set'}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Women Approved</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <div className="font-bold text-2xl">{stats.womenPercent}%</div>
            <div className="text-muted-foreground text-sm">
              ({stats.womenApproved})
            </div>
          </div>
          <p className="text-muted-foreground text-xs">
            Women in approved submissions
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Modality Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">Solo</span>
              <span className="font-semibold">{stats.approvedSolo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">Team</span>
              <div className="flex items-baseline gap-1">
                <span className="font-semibold">{stats.approvedTeam}</span>
                <span className="text-muted-foreground text-xs">
                  ({stats.approvedTeamHackers} hackers)
                </span>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">Looking</span>
              <span className="font-semibold">{stats.approvedTeamLooking}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
