import { formatDistanceToNow } from 'date-fns';
import { Calendar, FileText } from 'lucide-react';
import { Badge } from '@/src/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import type { Submission } from '@/src/lib/db/schema';

interface TeamSubmissionProps {
  submission: Submission | null;
}

export function TeamSubmission({ submission }: TeamSubmissionProps) {
  if (!submission) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Submission</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-muted-foreground">
            No submission found
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submission</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="font-medium text-muted-foreground text-sm">
              Source
            </div>
            <Badge variant="outline" className="capitalize">
              {submission.source}
            </Badge>
          </div>

          <div>
            <div className="font-medium text-muted-foreground text-sm">
              Type
            </div>
            <div className="text-sm">
              {submission.isTeam ? 'Team' : 'Individual'}
            </div>
          </div>

          {submission.submittedAt && (
            <div className="col-span-2">
              <div className="flex items-center gap-1 font-medium text-muted-foreground text-sm">
                <Calendar className="h-3 w-3" />
                Submitted At
              </div>
              <div className="text-sm">
                {new Date(submission.submittedAt).toLocaleString()} (
                {formatDistanceToNow(new Date(submission.submittedAt), {
                  addSuffix: true,
                })}
                )
              </div>
            </div>
          )}

          {submission.tallySubmissionId && (
            <div className="col-span-2">
              <div className="font-medium text-muted-foreground text-sm">
                Tally Submission ID
              </div>
              <div className="font-mono text-muted-foreground text-xs">
                {submission.tallySubmissionId}
              </div>
            </div>
          )}
        </div>

        {submission.rawPayload ? (
          <div>
            <div className="mb-2 flex items-center gap-1 font-medium text-muted-foreground text-sm">
              <FileText className="h-3 w-3" />
              Raw Payload
            </div>
            <div className="max-h-[300px] overflow-auto rounded-md bg-muted p-3">
              <pre className="font-mono text-xs">
                {JSON.stringify(submission.rawPayload, null, 2)}
              </pre>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
