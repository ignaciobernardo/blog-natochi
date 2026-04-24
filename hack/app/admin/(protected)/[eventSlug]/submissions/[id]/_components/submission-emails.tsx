'use client';

import { formatDistanceToNow } from 'date-fns';
import { Github, Mail } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/src/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import type { OutboundEmail } from '@/src/lib/db/schema';

interface SubmissionEmailsProps {
  emails: Array<OutboundEmail & { recipientGithub?: string | null }>;
}

export function SubmissionEmails({ emails }: SubmissionEmailsProps) {
  const statusLabels: Record<string, string> = {
    sent: 'Sent',
    pending: 'Pending',
    failed: 'Failed',
  };

  const extractGithubUsername = (github: string | null | undefined) => {
    if (!github) return null;
    // Extract username from GitHub URL (https://github.com/username)
    const match = github.match(/github\.com\/([^/]+)/);
    return match ? match[1] : github;
  };

  if (emails.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Emails
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-muted-foreground">
            No emails sent to team members
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Emails ({emails.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {emails.map((email) => (
            <Link
              key={email.id}
              href={`/admin/emails/${email.id}`}
              className="block space-y-2 rounded-lg border p-3 transition-colors hover:bg-foreground/5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium text-sm">{email.to}</p>
                    <Badge variant="outline" className="shrink-0 text-xs">
                      {statusLabels[email.status]}
                    </Badge>
                  </div>
                  {extractGithubUsername(email.recipientGithub) && (
                    <Badge variant="secondary" className="mt-1 w-fit gap-1">
                      <Github className="h-3 w-3" />
                      {extractGithubUsername(email.recipientGithub)}
                    </Badge>
                  )}
                </div>
              </div>
              <p className="truncate text-sm">{email.subject}</p>
              <div className="flex items-center justify-between gap-2 text-muted-foreground text-xs">
                <p>{email.templateName}</p>
                <p>
                  {formatDistanceToNow(new Date(email.createdAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
