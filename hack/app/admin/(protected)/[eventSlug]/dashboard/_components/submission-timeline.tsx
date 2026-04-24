import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { getSubmissionTimeline } from '@/src/queries/dashboard';
import { SubmissionTimelineChart } from './submission-timeline-chart';

interface SubmissionTimelineProps {
  eventId: string;
}

export async function SubmissionTimeline({ eventId }: SubmissionTimelineProps) {
  const timelineData = await getSubmissionTimeline(eventId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submission Timeline</CardTitle>
        <CardDescription>
          Cumulative submissions breakdown by participant type (solo, looking
          for team, with team)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SubmissionTimelineChart data={timelineData} />
      </CardContent>
    </Card>
  );
}
