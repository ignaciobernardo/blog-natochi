import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { getApprovedHackersStats } from '@/src/queries/dashboard';

interface ApprovedCountryBreakdownProps {
  eventId: string;
}

export async function ApprovedCountryBreakdown({
  eventId,
}: ApprovedCountryBreakdownProps) {
  const stats = await getApprovedHackersStats(eventId);

  if (stats.countryBreakdown.length === 0) {
    return null;
  }

  const maxCount = Math.max(...stats.countryBreakdown.map((c) => c.count));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Approved Hackers by Country</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stats.countryBreakdown.map((item) => {
            const percentage = (item.count / maxCount) * 100;
            return (
              <div key={item.country} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{item.country}</span>
                  <span className="text-muted-foreground">{item.count}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
