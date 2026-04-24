import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { getReviewDistributionByHacker } from '@/src/queries/dashboard';

interface ReviewDistributionProps {
  eventId: string;
}

const reviewLabels: Record<string, string> = {
  hell_yes: 'Hell Yes',
  yes: 'Yes',
  maybe: 'Maybe',
  no: 'No',
  hell_no: 'Hell No',
  no_review: 'No Review',
};

const reviewColors: Record<string, string> = {
  hell_yes: 'bg-green-500',
  yes: 'bg-green-400',
  maybe: 'bg-yellow-400',
  no: 'bg-orange-400',
  hell_no: 'bg-red-500',
  no_review: 'bg-gray-400',
};

export async function ReviewDistribution({ eventId }: ReviewDistributionProps) {
  const distribution = await getReviewDistributionByHacker(eventId);

  const totalHackers = distribution.reduce((sum, item) => sum + item.count, 0);

  if (totalHackers === 0) {
    return null;
  }

  const maxCount = Math.max(...distribution.map((item) => item.count));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Review Distribution by Hackers</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {distribution.map((item) => {
            const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
            const sharePercentage =
              totalHackers > 0
                ? Math.round((item.count / totalHackers) * 100)
                : 0;
            return (
              <div key={item.qualification} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">
                    {reviewLabels[item.qualification]}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-xs">
                      {sharePercentage}%
                    </span>
                    <span className="text-muted-foreground">{item.count}</span>
                  </div>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className={`h-full transition-all ${reviewColors[item.qualification]}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-muted-foreground text-xs">
          Based on {totalHackers} total hackers. Each hacker assigned the lowest
          review from their submission.
        </p>
      </CardContent>
    </Card>
  );
}
