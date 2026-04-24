'use client';

import { ChevronDown } from 'lucide-react';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export type VersionSummary = {
  id: string;
  slug: string;
  versionNumber: number;
  compressedSizeKB: string;
  uploadedAt: Date;
};

interface VersionSelectorProps {
  gameSlug: string;
  versions: VersionSummary[];
  currentVersionId: string;
  latestVersionId: string;
  isLatest: boolean;
  currentVersionNumber: number;
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'America/Santiago',
  });
}

export function VersionSelector({
  gameSlug,
  versions,
  currentVersionId,
  latestVersionId,
  isLatest,
  currentVersionNumber,
}: VersionSelectorProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex shrink-0 items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 font-mono text-primary text-xs transition-all hover:border-primary/50 hover:bg-primary/20"
      >
        V{currentVersionNumber}
        {!isLatest && <span className="text-[10px] text-yellow-400">old</span>}
        <ChevronDown className="h-3 w-3" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-2 min-w-[240px] overflow-hidden rounded-lg border border-white/10 bg-[#0a0a0a] shadow-2xl">
          {versions.map((v) => {
            const isCurrent = v.id === currentVersionId;
            const date = formatDate(v.uploadedAt);
            const isLatestVersion = v.id === latestVersionId;

            return (
              <button
                key={v.id}
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  if (isCurrent) {
                    return;
                  }

                  const href = isLatestVersion
                    ? `/26/arcade/${gameSlug}`
                    : `/26/arcade/${gameSlug}?version=${encodeURIComponent(`v${v.versionNumber}`)}`;

                  router.push(href as Route);
                }}
                className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-xs transition-colors ${
                  isCurrent
                    ? 'bg-primary/10 text-primary'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold">v{v.versionNumber}</span>
                  {isLatestVersion && (
                    <span className="rounded-full bg-primary/20 px-1.5 py-0.5 text-[9px] text-primary uppercase tracking-wider">
                      latest
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-white/35">
                  {date} · {v.compressedSizeKB} KB
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
