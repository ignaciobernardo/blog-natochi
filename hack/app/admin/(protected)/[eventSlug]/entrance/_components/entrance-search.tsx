'use client';

import { Search } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { Input } from '@/src/components/ui/input';

interface EntranceStats {
  totalHackers: number;
  totalMentors: number;
  totalPeople: number;
  totalEntered: number;
  percentage: number;
}

interface EntranceSearchProps {
  currentSearch: string;
  stats: EntranceStats;
}

export function EntranceSearch({ currentSearch, stats }: EntranceSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(currentSearch);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (search !== currentSearch) {
        const params = new URLSearchParams(searchParams.toString());
        if (search) {
          params.set('search', search);
        } else {
          params.delete('search');
        }
        startTransition(() => {
          router.push(`?${params.toString()}`);
        });
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [search, currentSearch, searchParams, router]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-6 text-sm">
        <div>
          <span className="text-muted-foreground">Hackers: </span>
          <span className="font-semibold">{stats.totalHackers}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Mentors: </span>
          <span className="font-semibold">{stats.totalMentors}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Total: </span>
          <span className="font-semibold">{stats.totalPeople}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Entered: </span>
          <span className="font-semibold">
            {stats.totalEntered} ({stats.percentage}%)
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            disabled={isPending}
          />
        </div>
      </div>
    </div>
  );
}
