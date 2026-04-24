'use client';

import { formatDistanceToNow } from 'date-fns';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import Link from 'next/link';
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
import { getAdminEventPath } from '@/src/lib/admin/routes';
import type { ArcadeAdminGameReviewRow } from '@/src/queries/arcade-games';

interface ArcadeGameTableProps {
  eventSlug: string;
  games: ArcadeAdminGameReviewRow[];
  voteCounts: Record<string, number>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function ArcadeGameTable({
  eventSlug,
  games,
  voteCounts,
  pagination,
}: ArcadeGameTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const changePage = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    router.push(`?${params.toString()}`);
  };

  if (games.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p>No arcade games found matching your filters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Game</TableHead>
              <TableHead>Latest Version</TableHead>
              <TableHead>Version Count</TableHead>
              <TableHead>Repository</TableHead>
              <TableHead>Validated Plays</TableHead>
              <TableHead>Votes</TableHead>
              <TableHead>Last Release</TableHead>
              <TableHead>Uploaded</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {games.map((game) => (
              <TableRow key={game.id}>
                <TableCell className="font-medium">{game.title}</TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium text-sm">
                      {game.githubUsername}
                    </div>
                    <code className="rounded bg-muted px-2 py-1 text-xs">
                      {game.id}
                    </code>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">v{game.versionNumber}</Badge>
                      <code className="rounded bg-muted px-2 py-1 text-xs">
                        {game.slug}
                      </code>
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {game.commitSha
                        ? game.commitSha.slice(0, 7)
                        : 'No commit SHA'}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{game.versionCount}</Badge>
                </TableCell>
                <TableCell>
                  <a
                    href={game.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                  >
                    {game.repoName}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{game.playCount}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{voteCounts[game.id] ?? 0}</Badge>
                </TableCell>
                <TableCell>
                  {game.lastReleaseAt ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            game.lastReleaseStatus === 'succeeded'
                              ? 'default'
                              : 'destructive'
                          }
                        >
                          {game.lastReleaseStatus}
                        </Badge>
                        {game.lastReleaseStage && (
                          <span className="text-muted-foreground text-xs">
                            {game.lastReleaseStage}
                          </span>
                        )}
                      </div>
                      <div className="text-sm">
                        {new Date(game.lastReleaseAt).toLocaleDateString(
                          'en-US',
                          {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          },
                        )}{' '}
                        {new Date(game.lastReleaseAt).toLocaleTimeString(
                          'en-US',
                          {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false,
                          },
                        )}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {formatDistanceToNow(new Date(game.lastReleaseAt), {
                          addSuffix: true,
                        })}
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">N/A</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="text-sm">
                      {new Date(game.latestVersionCreatedAt).toLocaleDateString(
                        'en-US',
                        {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        },
                      )}{' '}
                      {new Date(game.latestVersionCreatedAt).toLocaleTimeString(
                        'en-US',
                        {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false,
                        },
                      )}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {formatDistanceToNow(
                        new Date(game.latestVersionCreatedAt),
                        {
                          addSuffix: true,
                        },
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" asChild>
                    <Link
                      href={getAdminEventPath(eventSlug, 'arcade', game.id)}
                    >
                      View Details
                    </Link>
                  </Button>
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
          {pagination.total} games
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
