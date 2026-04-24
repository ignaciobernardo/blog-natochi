import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { getApprovedHackersStats } from '@/src/queries/dashboard';

interface ApprovedAgeDistributionProps {
  eventId: string;
}

export async function ApprovedAgeDistribution({
  eventId,
}: ApprovedAgeDistributionProps) {
  const stats = await getApprovedHackersStats(eventId);

  const totalWithAge = stats.ageDistribution.reduce(
    (sum, item) => sum + item.count,
    0,
  );

  if (totalWithAge === 0) {
    return null;
  }

  const maxCount = Math.max(...stats.ageDistribution.map((item) => item.count));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Age Distribution (Approved Hackers)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stats.ageDistribution.map((item) => {
            const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
            const sharePercentage =
              totalWithAge > 0
                ? Math.round((item.count / totalWithAge) * 100)
                : 0;
            return (
              <div key={item.ageRange} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{item.ageRange} years</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-xs">
                      {sharePercentage}%
                    </span>
                    <span className="text-muted-foreground">{item.count}</span>
                  </div>
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
        <p className="mt-4 text-muted-foreground text-xs">
          Based on {totalWithAge} hackers with age data
        </p>
      </CardContent>
    </Card>
  );
}
