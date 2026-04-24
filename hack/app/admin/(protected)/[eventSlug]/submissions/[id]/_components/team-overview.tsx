import { Badge } from '@/src/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import type { Submission, SubmissionStatus } from '@/src/lib/db/schema';

interface TeamOverviewProps {
  submission: Submission;
}

const statusColors: Record<SubmissionStatus, string> = {
  received: 'bg-blue-100 text-blue-800 border-blue-300',
  priority_waiting: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  asking_self_finance_trip: 'bg-purple-100 text-purple-800 border-purple-300',
  approved: 'bg-green-100 text-green-800 border-green-300',
  onboarding_request: 'bg-cyan-100 text-cyan-800 border-cyan-300',
  onboarding_expired: 'bg-gray-100 text-gray-800 border-gray-300',
  onboarding_complete: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  rejected: 'bg-red-100 text-red-800 border-red-300',
  waiting_list: 'bg-amber-100 text-amber-800 border-amber-300',
  withdrawn: 'bg-orange-100 text-orange-800 border-orange-300',
  archived: 'bg-slate-100 text-slate-800 border-slate-300',
};

const statusLabels: Record<SubmissionStatus, string> = {
  received: 'Received',
  priority_waiting: 'Priority Waiting',
  asking_self_finance_trip: 'Asking Self Finance Trip',
  approved: 'Approved',
  onboarding_request: 'Onboarding Request',
  onboarding_expired: 'Onboarding Expired',
  onboarding_complete: 'Onboarding Complete',
  rejected: 'Rejected',
  waiting_list: 'Waiting List',
  withdrawn: 'Withdrawn',
  archived: 'Archived',
};

export function TeamOverview({ submission }: TeamOverviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="font-medium text-muted-foreground text-sm">
              Status
            </div>
            <Badge
              variant="outline"
              className={statusColors[submission.status]}
            >
              {statusLabels[submission.status]}
            </Badge>
          </div>

          <div>
            <div className="font-medium text-muted-foreground text-sm">
              Cohort
            </div>
            <div className="text-sm capitalize">{submission.cohort}</div>
          </div>

          <div>
            <div className="font-medium text-muted-foreground text-sm">
              Modality
            </div>
            <div className="text-sm capitalize">{submission.modality}</div>
          </div>

          <div>
            <div className="font-medium text-muted-foreground text-sm">
              Country
            </div>
            <div className="text-sm">{submission.country}</div>
          </div>

          <div className="col-span-2">
            <div className="font-medium text-muted-foreground text-sm">
              Submission ID
            </div>
            <div className="font-mono text-muted-foreground text-xs">
              {submission.id}
            </div>
          </div>

          <div className="col-span-2">
            <div className="font-medium text-muted-foreground text-sm">
              Submitted At
            </div>
            <div className="text-sm">
              {new Date(submission.submittedAt).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
