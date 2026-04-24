import { formatDistanceToNow } from 'date-fns';
import { ArrowRight, Clock } from 'lucide-react';
import { Badge } from '@/src/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import type { StatusHistory, SubmissionStatus } from '@/src/lib/db/schema';

interface TeamStatusHistoryProps {
  history: Array<
    StatusHistory & {
      changedByAdmin: { fullName: string; email: string } | null;
    }
  >;
}

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

export function TeamStatusHistory({ history }: TeamStatusHistoryProps) {
  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Status History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-muted-foreground">
            No status changes recorded
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status History ({history.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {history.map((record) => (
            <div
              key={record.id}
              className="space-y-2 rounded-lg border bg-card p-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {record.fromStatus
                    ? statusLabels[record.fromStatus as SubmissionStatus]
                    : 'None'}
                </Badge>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <Badge variant="outline" className="text-xs">
                  {statusLabels[record.toStatus as SubmissionStatus]}
                </Badge>
              </div>

              <div className="flex items-center gap-1 text-muted-foreground text-xs">
                <Clock className="h-3 w-3" />
                {new Date(record.changedAt).toLocaleString()} (
                {formatDistanceToNow(new Date(record.changedAt), {
                  addSuffix: true,
                })}
                )
              </div>

              {record.changedByAdmin && (
                <div className="text-muted-foreground text-xs">
                  Changed by: {record.changedByAdmin.fullName}
                </div>
              )}

              {record.context ? (
                <div className="whitespace-pre-wrap rounded bg-muted p-2 text-xs">
                  {(() => {
                    const ctx = record.context;
                    return typeof ctx === 'string'
                      ? ctx
                      : JSON.stringify(ctx, null, 2);
                  })()}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
