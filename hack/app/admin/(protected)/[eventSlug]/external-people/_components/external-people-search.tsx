'use client';

import { Search } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useRef, useState } from 'react';
import { Input } from '@/src/components/ui/input';

export function ExternalPeopleSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get('q') ?? '');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleChange(newValue: string) {
    setValue(newValue);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (newValue.trim()) {
        params.set('q', newValue.trim());
      } else {
        params.delete('q');
      }
      const qs = params.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ''}` as never);
    }, 300);
  }

  return (
    <div className="relative">
      <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search by name, slug, category, or role..."
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        className="pl-10"
      />
    </div>
  );
}
