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
import type { ArcadeReviewSearchParams } from '@/src/lib/schemas/arcade-review.schema';

interface ArcadeGameFiltersProps {
  eventSlug: string;
  initialParams: ArcadeReviewSearchParams;
}

export function ArcadeGameFilters({
  eventSlug,
  initialParams,
}: ArcadeGameFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(initialParams.search || '');
  const [sortOrder, setSortOrder] = useState(initialParams.sortOrder);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const updateFilters = () => {
    const params = new URLSearchParams(searchParams);

    if (search) {
      params.set('search', search);
    } else {
      params.delete('search');
    }

    params.set('sortOrder', sortOrder);

    params.delete('page');

    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  };

  const resetFilters = () => {
    setSearch('');
    setSortOrder('desc');

    startTransition(() => {
      router.push(getAdminEventPath(eventSlug, 'arcade'));
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
            placeholder="Search by GitHub username or repository..."
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
              <div className="mb-2 font-medium text-sm">Sort Order</div>
              <Select
                value={sortOrder}
                onValueChange={(value: 'asc' | 'desc') => setSortOrder(value)}
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
