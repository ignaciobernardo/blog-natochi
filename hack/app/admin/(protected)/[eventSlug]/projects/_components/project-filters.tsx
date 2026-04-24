'use client';

import { ChevronDown, Search, SlidersHorizontal } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button } from '@/src/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/src/components/ui/collapsible';
import { Input } from '@/src/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import { getAdminEventPath } from '@/src/lib/admin/routes';
import type { ProjectAdminSearchParams } from '@/src/lib/schemas/project-admin.schema';

interface ProjectFiltersProps {
  eventSlug: string;
  initialParams: ProjectAdminSearchParams;
}

export function ProjectFilters({
  eventSlug,
  initialParams,
}: ProjectFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(initialParams.search || '');
  const [hasVideo, setHasVideo] = useState<string>(
    initialParams.hasVideo === true
      ? 'true'
      : initialParams.hasVideo === false
        ? 'false'
        : 'all',
  );
  const [hasRepo, setHasRepo] = useState<string>(
    initialParams.hasRepo === true
      ? 'true'
      : initialParams.hasRepo === false
        ? 'false'
        : 'all',
  );
  const [sortBy, setSortBy] = useState(initialParams.sortBy);
  const [sortOrder, setSortOrder] = useState(initialParams.sortOrder);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const updateFilters = () => {
    const params = new URLSearchParams(searchParams);

    if (search) {
      params.set('search', search);
    } else {
      params.delete('search');
    }

    if (hasVideo !== 'all') {
      params.set('hasVideo', hasVideo);
    } else {
      params.delete('hasVideo');
    }

    if (hasRepo !== 'all') {
      params.set('hasRepo', hasRepo);
    } else {
      params.delete('hasRepo');
    }

    params.set('sortBy', sortBy);
    params.set('sortOrder', sortOrder);
    params.delete('page');

    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  };

  const resetFilters = () => {
    setSearch('');
    setHasVideo('all');
    setHasRepo('all');
    setSortBy('createdAt');
    setSortOrder('desc');

    startTransition(() => {
      router.push(getAdminEventPath(eventSlug, 'projects') as any);
    });
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      updateFilters();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-muted-foreground" />
          <Input
            placeholder="Search by name, description, or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="pl-10"
          />
        </div>

        <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  isFiltersOpen ? 'rotate-180' : ''
                }`}
              />
            </Button>
          </CollapsibleTrigger>
        </Collapsible>
      </div>

      <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
        <CollapsibleContent className="space-y-4 pt-2">
          <div className="flex flex-wrap items-end gap-4">
            <div className="min-w-[180px] flex-1">
              <div className="mb-2 font-medium text-sm">Has Video</div>
              <Select value={hasVideo} onValueChange={setHasVideo}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by video" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  <SelectItem value="true">With Video</SelectItem>
                  <SelectItem value="false">Without Video</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-[180px] flex-1">
              <div className="mb-2 font-medium text-sm">Has Repository</div>
              <Select value={hasRepo} onValueChange={setHasRepo}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by repo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  <SelectItem value="true">With Repository</SelectItem>
                  <SelectItem value="false">Without Repository</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-[180px] flex-1">
              <div className="mb-2 font-medium text-sm">Sort By</div>
              <Select
                value={sortBy}
                onValueChange={(value: any) => setSortBy(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Created Date</SelectItem>
                  <SelectItem value="updatedAt">Updated Date</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-[180px] flex-1">
              <div className="mb-2 font-medium text-sm">Sort Order</div>
              <Select
                value={sortOrder}
                onValueChange={(value: any) => setSortOrder(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Newest First</SelectItem>
                  <SelectItem value="asc">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={updateFilters} disabled={isPending}>
              {isPending ? 'Applying...' : 'Apply Filters'}
            </Button>
            <Button
              variant="outline"
              onClick={resetFilters}
              disabled={isPending}
            >
              Reset
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
