'use client';

import { ExternalLink, Loader2, X } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { getArcadeEmbedUrl } from '@/src/lib/utils/arcade';
import type { ArcadeGameFlat } from '@/src/queries/arcade-games';

interface GameModalProps {
  game: ArcadeGameFlat;
  onClose: () => void;
}

export function GameModal({ game, onClose }: GameModalProps) {
  const embedUrl = getArcadeEmbedUrl(game.id);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="game-modal-title"
      className="fixed inset-0 z-50 bg-black/90 p-4 md:p-8"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClose();
        }
      }}
    >
      <div
        role="document"
        className="relative h-full w-full border-4 border-primary bg-background"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {/* Sidebar - Left - Hidden on mobile */}
        <aside className="absolute top-0 left-0 hidden h-full w-80 overflow-y-auto border-primary border-r-4 bg-background p-6 md:block">
          {/* Close Button - Desktop */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 z-20 border-2 border-primary bg-background p-2 text-primary transition-all hover:bg-primary hover:text-background"
          >
            <X className="h-6 w-6" />
          </button>
          <h2
            id="game-modal-title"
            className="mb-6 font-bold font-title text-2xl text-primary"
          >
            {game.title}
          </h2>

          {/* Game Cover */}
          {game.coverUrl && (
            <div className="mb-6">
              <div className="relative aspect-[4/3] w-full overflow-hidden border-2 border-primary">
                <Image
                  src={game.coverUrl}
                  alt={`Cover for ${game.title}`}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          )}

          <div className="space-y-4">
            {game.description && (
              <div>
                <h3 className="mb-2 font-semibold text-primary text-sm">
                  Description
                </h3>
                <p className="text-sm">{game.description}</p>
              </div>
            )}

            <div>
              <h3 className="mb-2 font-semibold text-primary text-sm">
                Author
              </h3>
              <a
                href={`https://github.com/${game.githubUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-primary text-sm hover:underline"
              >
                <span className="truncate">{game.githubUsername}</span>
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            </div>

            <div>
              <h3 className="mb-2 font-semibold text-primary text-sm">
                Repository
              </h3>
              <a
                href={game.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-primary text-sm hover:underline"
              >
                <span className="truncate">{game.repoName}</span>
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            </div>

            {game.commitDate && (
              <div>
                <h3 className="mb-2 font-semibold text-primary text-sm">
                  Last Commit
                </h3>
                <p className="text-sm">
                  {new Date(game.commitDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: 'America/Santiago',
                  })}
                </p>
                {game.commitSha && (
                  <code className="mt-1 inline-block rounded border border-primary bg-muted px-2 py-1 font-mono text-xs">
                    {game.commitSha.substring(0, 7)}
                  </code>
                )}
              </div>
            )}

            <div>
              <h3 className="mb-2 font-semibold text-primary text-sm">
                Code Size
              </h3>
              <div className="space-y-1 text-sm">
                <p>Original: {(game.code.length / 1024).toFixed(2)} KB</p>
                <p>
                  Compressed: {(game.codeMinified.length / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Close Button - Mobile only */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 border-2 border-primary bg-background p-2 text-primary transition-all hover:bg-primary hover:text-background md:hidden"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Game iframe - Center (full width on mobile, offset on desktop) */}
        <div className="absolute inset-0 flex items-center justify-center p-4 md:left-80 md:p-8">
          <div
            className="relative overflow-hidden border-4 border-primary bg-black"
            style={{
              width: '100%',
              height: '100%',
              maxHeight: '85vh',
              aspectRatio: '4/3',
            }}
          >
            {isLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-black">
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <p className="font-mono text-primary text-sm">
                    Loading game...
                  </p>
                </div>
              </div>
            )}
            <iframe
              src={embedUrl}
              title={game.title}
              className="h-full w-full"
              sandbox="allow-scripts"
              loading="eager"
              onLoad={() => setIsLoading(false)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
