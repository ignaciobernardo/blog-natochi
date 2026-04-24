import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { getStatusBreakdownByModality } from '@/src/queries/dashboard';
import { StatusBreakdownChart } from './status-breakdown-chart';

interface StatusBreakdownProps {
  eventId: string;
}

export async function StatusBreakdown({ eventId }: StatusBreakdownProps) {
  const data = await getStatusBreakdownByModality(eventId);

  if (data.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submission Status Breakdown</CardTitle>
        <CardDescription>
          Distribution of submissions by status and modality. Team bars show
          both submission count and total hacker count.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <StatusBreakdownChart data={data} />
      </CardContent>
    </Card>
  );
}
