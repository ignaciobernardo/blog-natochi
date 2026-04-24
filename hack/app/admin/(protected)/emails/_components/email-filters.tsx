'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import type { EmailSearchParams } from '@/src/lib/schemas/email-search.schema';

interface EmailFiltersProps {
  initialParams: EmailSearchParams;
}

export function EmailFilters({ initialParams }: EmailFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(initialParams.search || '');
  const [status, setStatus] = useState<string>(initialParams.status || 'all');
  const [sortBy, setSortBy] = useState(initialParams.sortBy);
  const [sortOrder, setSortOrder] = useState(initialParams.sortOrder);

  useEffect(() => {
    setSearch(initialParams.search || '');
    setStatus(initialParams.status || 'all');
    setSortBy(initialParams.sortBy);
    setSortOrder(initialParams.sortOrder);
  }, [initialParams]);

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams);
    params.set('page', '1');

    if (search) {
      params.set('search', search);
    } else {
      params.delete('search');
    }

    if (status && status !== 'all') {
      params.set('status', status);
    } else {
      params.delete('status');
    }

    params.set('sortBy', sortBy);
    params.set('sortOrder', sortOrder);

    router.push(`?${params.toString()}`);
  };

  const clearFilters = () => {
    setSearch('');
    setStatus('all');
    setSortBy('createdAt');
    setSortOrder('desc');
    router.push('/admin/emails');
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            placeholder="Subject, recipient, content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                applyFilters();
              }
            }}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sortBy">Sort By</Label>
          <Select
            value={sortBy}
            onValueChange={(value: any) => setSortBy(value)}
          >
            <SelectTrigger id="sortBy">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Created Date</SelectItem>
              <SelectItem value="sentAt">Sent Date</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sortOrder">Order</Label>
          <Select
            value={sortOrder}
            onValueChange={(value: any) => setSortOrder(value)}
          >
            <SelectTrigger id="sortOrder">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Newest First</SelectItem>
              <SelectItem value="asc">Oldest First</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={applyFilters}>Apply Filters</Button>
        <Button variant="outline" onClick={clearFilters}>
          Clear Filters
        </Button>
      </div>
    </div>
  );
}
