'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArcadeDeadlineCountdown } from './arcade-deadline-countdown';

interface SubmitGameButtonProps {
  variant: 'desktop' | 'mobile';
}

export function SubmitGameButton({ variant }: SubmitGameButtonProps) {
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const checkExpired = () => {
      // Deadline: November 10, 2025 23:59 Chile time (CLT = UTC-3)
      const eventDate = new Date('2025-11-10T23:59:00-03:00').getTime();
      const now = Date.now();
      setIsExpired(now > eventDate);
    };

    checkExpired();
    const timer = setInterval(checkExpired, 1000);
    return () => clearInterval(timer);
  }, []);

  if (isExpired) {
    return (
      <div
        className={`inline-flex cursor-not-allowed flex-col items-center gap-2 border-2 border-muted-foreground/30 bg-muted/50 px-4 py-3 opacity-60 ${
          variant === 'desktop' ? 'sm:px-6 sm:py-4' : ''
        }`}
      >
        <h3
          className={`font-bold font-title text-muted-foreground ${
            variant === 'desktop'
              ? 'text-base sm:text-lg md:text-xl'
              : 'text-base'
          }`}
        >
          SUBE TU JUEGO
        </h3>
        <ArcadeDeadlineCountdown />
      </div>
    );
  }

  return (
    <Link
      href="/25/arcade"
      className={`inline-flex flex-col items-center gap-2 border-2 border-primary bg-background px-4 py-3 transition-all hover:bg-primary/10 ${
        variant === 'desktop' ? 'sm:px-6 sm:py-4' : ''
      }`}
    >
      <h3
        className={`font-bold font-title text-primary ${
          variant === 'desktop'
            ? 'text-base sm:text-lg md:text-xl'
            : 'text-base'
        }`}
      >
        SUBE TU JUEGO
      </h3>
      <ArcadeDeadlineCountdown />
    </Link>
  );
}
