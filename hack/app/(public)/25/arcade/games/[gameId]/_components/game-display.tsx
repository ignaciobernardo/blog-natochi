'use client';

import { Github, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

interface GameDisplayProps {
  title: string;
  githubUsername: string;
  repoUrl: string;
  description: string | null;
  embedUrl: string;
}

export function GameDisplay({
  title,
  githubUsername,
  repoUrl,
  description,
  embedUrl,
}: GameDisplayProps) {
  const headerRef = useRef<HTMLDivElement>(null);
  const metadataRef = useRef<HTMLDivElement>(null);
  const [gameHeight, setGameHeight] = useState(600);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const calculateGameSize = () => {
      const viewportHeight = window.innerHeight;
      const headerHeight = headerRef.current?.offsetHeight || 0;
      const metadataHeight = metadataRef.current?.offsetHeight || 0;
      const padding = 32; // py-2 * 2 + some buffer

      const availableHeight =
        viewportHeight - headerHeight - metadataHeight - padding;
      setGameHeight(availableHeight);
    };

    calculateGameSize();
    window.addEventListener('resize', calculateGameSize);

    return () => window.removeEventListener('resize', calculateGameSize);
  }, [description]);

  // Calculate width based on 4:3 aspect ratio
  const gameWidth = (gameHeight * 4) / 3;

  return (
    <div className="mx-auto flex h-screen max-w-7xl flex-col overflow-hidden px-4 py-2 font-mono">
      {/* Compact Header */}
      <div ref={headerRef} className="flex-shrink-0 text-center">
        <Link
          href="/25/arcade"
          className="inline-block transition-opacity hover:opacity-80"
        >
          <h1
            className="font-bold font-logo text-foreground/90 text-lg uppercase tracking-wider md:text-xl"
            style={{ fontFamily: 'var(--font-logo)' }}
          >
            Platanus Hack 25 Arcade
          </h1>
        </Link>
      </div>

      {/* Game Title, Author & Description */}
      <div
        ref={metadataRef}
        className="flex flex-shrink-0 flex-col items-center gap-1 py-2 text-center"
      >
        <h3 className="crt-glow font-bold text-primary text-xl md:text-2xl">
          {title}
        </h3>
        <div className="flex items-center gap-2 text-foreground/60 text-xs">
          <span>by</span>
          <a
            href={repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 font-mono text-foreground transition-colors hover:text-primary"
          >
            <Github className="h-3 w-3" />
            {githubUsername}
          </a>
        </div>
        {description && (
          <p className="max-w-3xl text-foreground/70 text-xs">{description}</p>
        )}
      </div>

      {/* Game Iframe - Dynamically sized */}
      <div className="flex flex-1 items-center justify-center overflow-hidden">
        <div
          className="relative overflow-hidden rounded-lg border-4 border-primary bg-black shadow-[0_0_30px_rgba(255,214,0,0.3)]"
          style={{
            width: `${Math.min(gameWidth, window.innerWidth - 32)}px`,
            height: `${gameHeight}px`,
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
            title={title}
            className="h-full w-full"
            sandbox="allow-scripts"
            loading="lazy"
            onLoad={() => setIsLoading(false)}
          />
        </div>
      </div>
    </div>
  );
}
