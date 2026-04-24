'use client';

import { formatDistanceToNow } from 'date-fns';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  XCircle,
} from 'lucide-react';
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
import type { Project } from '@/src/lib/db/schema';

interface ProjectTableProps {
  eventSlug: string;
  projects: Array<
    Project & {
      team: {
        id: string;
        slug: string;
        trackId: string | null;
      } | null;
      track: {
        id: string;
        name: string;
      } | null;
      memberCount: number;
    }
  >;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function ProjectTable({
  eventSlug,
  projects,
  pagination,
}: ProjectTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const changePage = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    router.push(`?${params.toString()}`);
  };

  if (projects.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p>No projects found matching your filters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>Track</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Video</TableHead>
              <TableHead>Repository</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project) => (
              <TableRow key={project.id}>
                <TableCell className="font-medium">
                  <div className="flex flex-col gap-1">
                    <span>{project.name}</span>
                    <code className="rounded bg-muted px-2 py-1 text-xs">
                      {project.slug}
                    </code>
                  </div>
                </TableCell>
                <TableCell>
                  {project.team ? (
                    <Link
                      href={getAdminEventPath(
                        eventSlug,
                        'teams',
                        project.team.id,
                      )}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {project.team.slug}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground text-sm">
                      No team
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {project.track ? (
                    <Badge variant="secondary">{project.track.name}</Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">
                      No track
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{project.memberCount}</Badge>
                </TableCell>
                <TableCell>
                  {project.videoUrl ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <a
                        href={project.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-600 text-sm hover:text-blue-800"
                      >
                        View
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground text-sm">
                        No video
                      </span>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {project.repoUrl ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <a
                        href={project.repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-600 text-sm hover:text-blue-800"
                      >
                        View
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground text-sm">
                        No repo
                      </span>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="text-sm">
                      {new Date(project.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {formatDistanceToNow(new Date(project.createdAt), {
                        addSuffix: true,
                      })}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" asChild>
                    <Link
                      href={
                        getAdminEventPath(
                          eventSlug,
                          'projects',
                          project.id,
                        ) as any
                      }
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
          {pagination.total} projects
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
