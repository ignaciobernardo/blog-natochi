import { AlertCircle } from 'lucide-react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import type { DuplicateHackerInNewerSubmission } from '@/src/queries/submissions';

interface DuplicateHackersAlertProps {
  duplicateHackers: DuplicateHackerInNewerSubmission[];
}

export function DuplicateHackersAlert({
  duplicateHackers,
}: DuplicateHackersAlertProps) {
  if (duplicateHackers.length === 0) {
    return null;
  }

  const groupedBySubmission = duplicateHackers.reduce(
    (acc, hacker) => {
      if (!acc[hacker.newerSubmissionId]) {
        acc[hacker.newerSubmissionId] = {
          submissionId: hacker.newerSubmissionId,
          submittedAt: hacker.newerSubmissionSubmittedAt,
          hackers: [],
        };
      }
      acc[hacker.newerSubmissionId].hackers.push({
        name: hacker.hackerName,
        github: hacker.hackerGithub,
      });
      return acc;
    },
    {} as Record<
      string,
      {
        submissionId: string;
        submittedAt: Date;
        hackers: Array<{ name: string; github: string | null }>;
      }
    >,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-primary" />
          Hacker(s) with More Recent Submission(s)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Object.entries(groupedBySubmission).map(([submissionId, data]) => (
            <div
              key={submissionId}
              className="space-y-2 rounded-lg border-2 border-primary/20 bg-primary/5 p-3 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 space-y-1">
                  {data.hackers.map((hacker) => (
                    <div
                      key={`${submissionId}-${hacker.name}`}
                      className="text-sm"
                    >
                      <p className="font-medium">{hacker.name}</p>
                      {hacker.github && (
                        <p className="text-muted-foreground text-xs">
                          {hacker.github}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                <div className="text-right text-muted-foreground text-xs">
                  {new Date(data.submittedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href={`/admin/submissions/${submissionId}`}
                  className="font-medium text-xs underline hover:text-primary"
                >
                  View newer submission
                </Link>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
