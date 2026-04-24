import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { getOutboundEmail } from '@/src/queries/emails';
import { DeleteEmailButton } from './delete-email-button';
import { ResendEmailButton } from './resend-email-button';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EmailDetailPage({ params }: PageProps) {
  const { id } = await params;
  const email = await getOutboundEmail(id);

  if (!email) {
    notFound();
  }

  const statusColors: Record<string, string> = {
    sent: 'bg-green-100 text-green-800 border-green-300',
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    failed: 'bg-red-100 text-red-800 border-red-300',
  };

  const statusLabels: Record<string, string> = {
    sent: 'Sent',
    pending: 'Pending',
    failed: 'Failed',
  };

  return (
    <div className="container mx-auto space-y-6 py-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/admin/emails">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Email Details</h1>
          <p className="text-muted-foreground">
            View email content and metadata
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Email Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="font-medium text-muted-foreground text-sm">
                  Subject
                </div>
                <div className="mt-1 text-sm">{email.subject}</div>
              </div>

              <div>
                <div className="font-medium text-muted-foreground text-sm">
                  Status
                </div>
                <Badge
                  variant="outline"
                  className={`mt-1 ${statusColors[email.status]}`}
                >
                  {statusLabels[email.status]}
                </Badge>
              </div>

              <div>
                <div className="font-medium text-muted-foreground text-sm">
                  Template
                </div>
                <div className="mt-1 font-mono text-sm">
                  {email.templateName}
                </div>
              </div>

              <div>
                <div className="font-medium text-muted-foreground text-sm">
                  Recipient
                </div>
                <div className="mt-1 text-sm">{email.to}</div>
              </div>

              {email.cc && email.cc.length > 0 && (
                <div>
                  <div className="font-medium text-muted-foreground text-sm">
                    CC
                  </div>
                  <div className="mt-1 text-sm">{email.cc.join(', ')}</div>
                </div>
              )}

              {email.bcc && email.bcc.length > 0 && (
                <div>
                  <div className="font-medium text-muted-foreground text-sm">
                    BCC
                  </div>
                  <div className="mt-1 text-sm">{email.bcc.join(', ')}</div>
                </div>
              )}

              {email.replyTo && (
                <div>
                  <div className="font-medium text-muted-foreground text-sm">
                    Reply To
                  </div>
                  <div className="mt-1 text-sm">{email.replyTo}</div>
                </div>
              )}

              <div>
                <div className="font-medium text-muted-foreground text-sm">
                  Created At
                </div>
                <div className="mt-1 text-sm">
                  {new Date(email.createdAt).toLocaleString('en-US', {
                    dateStyle: 'long',
                    timeStyle: 'medium',
                  })}
                </div>
              </div>

              {email.sentAt && (
                <div>
                  <div className="font-medium text-muted-foreground text-sm">
                    Sent At
                  </div>
                  <div className="mt-1 text-sm">
                    {new Date(email.sentAt).toLocaleString('en-US', {
                      dateStyle: 'long',
                      timeStyle: 'medium',
                    })}
                  </div>
                </div>
              )}

              {email.externalMessageId && (
                <div>
                  <div className="font-medium text-muted-foreground text-sm">
                    External Message ID
                  </div>
                  <div className="mt-1 break-all font-mono text-xs">
                    {email.externalMessageId}
                  </div>
                </div>
              )}

              {email.failureReason && (
                <div>
                  <div className="font-medium text-muted-foreground text-sm">
                    Failure Reason
                  </div>
                  <div className="mt-1 text-destructive text-sm">
                    {email.failureReason}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
              <CardDescription>Manage this email</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <ResendEmailButton emailId={email.id} />
              {email.status === 'pending' ? (
                <DeleteEmailButton emailId={email.id} />
              ) : null}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Email Preview</CardTitle>
              <CardDescription>
                HTML content as it appears to recipients
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border bg-muted/50 p-4">
                <iframe
                  srcDoc={email.htmlContent}
                  className="h-[600px] w-full rounded-md bg-white"
                  title="Email Preview"
                  sandbox="allow-same-origin"
                />
              </div>
            </CardContent>
          </Card>

          {email.textContent && (
            <Card>
              <CardHeader>
                <CardTitle>Plain Text Version</CardTitle>
                <CardDescription>
                  Fallback content for plain text email clients
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap rounded-md bg-muted p-4 font-mono text-sm">
                  {email.textContent}
                </pre>
              </CardContent>
            </Card>
          )}

          {email.templateData ? (
            <Card>
              <CardHeader>
                <CardTitle>Template Data</CardTitle>
                <CardDescription>
                  Data passed to the email template
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap rounded-md bg-muted p-4 font-mono text-sm">
                  {JSON.stringify(email.templateData, null, 2)}
                </pre>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
