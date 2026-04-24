'use client';

import { formatDistanceToNow } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/src/components/ui/table';
import type { OutboundEmail } from '@/src/lib/db/schema';
import { DeletePendingEmailButton } from './delete-pending-email-button';

interface EmailTableProps {
  emails: OutboundEmail[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function EmailTable({ emails, pagination }: EmailTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const changePage = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    router.push(`?${params.toString()}`);
  };

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

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
  };

  if (emails.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p>No emails found matching your filters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Recipient</TableHead>
              <TableHead className="w-[300px]">Subject</TableHead>
              <TableHead className="w-[150px]">Template</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Sent</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {emails.map((email) => (
              <TableRow key={email.id}>
                <TableCell>
                  <div className="font-medium text-sm">{email.to}</div>
                </TableCell>
                <TableCell>
                  <div className="text-sm" title={email.subject}>
                    {truncateText(email.subject, 50)}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-mono text-xs">
                    {email.templateName}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={statusColors[email.status]}
                  >
                    {statusLabels[email.status]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="text-sm">
                      {new Date(email.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {formatDistanceToNow(new Date(email.createdAt), {
                        addSuffix: true,
                      })}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {email.sentAt ? (
                    <div className="space-y-1">
                      <div className="text-sm">
                        {new Date(email.sentAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {formatDistanceToNow(new Date(email.sentAt), {
                          addSuffix: true,
                        })}
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {email.status === 'pending' ? (
                      <DeletePendingEmailButton emailId={email.id} />
                    ) : null}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        router.push(`/admin/emails/${email.id}` as any);
                      }}
                    >
                      View Details
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-4 py-4">
        <div className="text-muted-foreground text-sm">
          Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
          {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
          {pagination.total} emails
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => changePage(pagination.page - 1)}
            disabled={pagination.page === 1}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Previous
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter((pageNum) => {
                if (pagination.totalPages <= 7) return true;
                if (pageNum === 1 || pageNum === pagination.totalPages)
                  return true;
                if (
                  pageNum >= pagination.page - 1 &&
                  pageNum <= pagination.page + 1
                )
                  return true;
                return false;
              })
              .map((pageNum, index, array) => {
                const showEllipsis =
                  index > 0 && pageNum - array[index - 1] > 1;

                return (
                  <div key={pageNum} className="flex items-center gap-1">
                    {showEllipsis && (
                      <span className="px-2 text-muted-foreground">...</span>
                    )}
                    <Button
                      variant={
                        pageNum === pagination.page ? 'default' : 'outline'
                      }
                      size="sm"
                      onClick={() => changePage(pageNum)}
                      className="min-w-[2.5rem]"
                    >
                      {pageNum}
                    </Button>
                  </div>
                );
              })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => changePage(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
          >
            Next
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
