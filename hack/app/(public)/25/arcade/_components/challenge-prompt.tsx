'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

interface ChallengePromptProps {
  prompt: string;
  repoUrl?: string;
  onBoxPosition?: (position: { x: number; y: number }) => void;
}

function DeadlineCountdown() {
  const calculateTimeLeft = () => {
    const eventDate = new Date('2025-11-10T23:59:00-03:00').getTime();
    const now = Date.now();
    const difference = eventDate - now;

    if (difference > 0) {
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        isExpired: false,
      };
    }
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft);

  useEffect(() => {
    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (timeLeft.isExpired) {
    return <span className="font-mono text-black text-xs">[EXPIRED]</span>;
  }

  return (
    <span className="font-mono text-black text-xs">
      [{timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}
      s]
    </span>
  );
}

export function ChallengePrompt({
  prompt,
  repoUrl,
  onBoxPosition,
}: ChallengePromptProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const checkExpired = () => {
      const eventDate = new Date('2025-11-10T23:59:00-03:00').getTime();
      const now = Date.now();
      setIsExpired(now > eventDate);
    };

    checkExpired();
    const timer = setInterval(checkExpired, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (boxRef.current && onBoxPosition) {
      const updatePosition = () => {
        const rect = boxRef.current?.getBoundingClientRect();
        if (rect) {
          const x = window.innerWidth / 2;
          const y = rect.top - 40; // Few squares above the box
          console.log('Box position:', { x, y, rectTop: rect.top });
          onBoxPosition({ x, y });
        }
      };

      // Delay to ensure layout is calculated
      const timer = setTimeout(updatePosition, 100);
      window.addEventListener('resize', updatePosition);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [onBoxPosition]);

  return (
    <div className="flex flex-col gap-6 font-mono">
      <div className="flex flex-col gap-2 text-center">
        <Link
          href="/25"
          className="flex cursor-pointer flex-col gap-1 transition-opacity hover:opacity-80"
        >
          <h1
            className="font-bold font-logo text-4xl text-foreground/90 uppercase tracking-wider md:text-5xl"
            style={{ fontFamily: 'var(--font-logo)' }}
          >
            Platanus Hack 25
          </h1>
          <h2
            className="crt-glow font-bold font-logo text-3xl text-primary uppercase tracking-wider md:text-4xl"
            style={{ fontFamily: 'var(--font-logo)' }}
          >
            Arcade Challenge
          </h2>
        </Link>
        <div className="h-4" />
      </div>

      <div
        ref={boxRef}
        className="rounded-lg border-4 border-primary bg-black/50 p-8 shadow-[0_0_30px_rgba(255,214,0,0.3)]"
      >
        <div className="flex flex-col gap-4">
          <div className="crt-glow whitespace-pre-wrap text-foreground/90 text-lg leading-relaxed">
            {prompt.split('\n').map((line) => {
              const isSectionTitle =
                line === 'MISSION' ||
                line === 'REQUIREMENTS' ||
                line === 'PRIZE' ||
                line === 'DEADLINE';
              return (
                <div
                  key={line}
                  className={
                    isSectionTitle && prompt.split('\n').indexOf(line) > 0
                      ? 'mt-4'
                      : ''
                  }
                >
                  {isSectionTitle ? (
                    <span className="font-bold text-primary">{line}</span>
                  ) : (
                    <span>{line}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 flex flex-col items-stretch gap-4 sm:flex-row sm:justify-center">
          {repoUrl &&
            (isExpired ? (
              <div className="flex h-[60px] cursor-not-allowed flex-col items-center justify-center gap-1 rounded bg-foreground/20 px-6 font-bold text-foreground/40 text-sm uppercase tracking-wider">
                <span>&gt;&gt; EMPEZAR CHALLENGE &lt;&lt;</span>
                <DeadlineCountdown />
              </div>
            ) : (
              <a
                href={repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-[60px] flex-col items-center justify-center gap-1 rounded bg-primary px-6 font-bold text-black text-sm uppercase tracking-wider shadow-[0_0_20px_rgba(255,214,0,0.4)] transition-colors hover:bg-primary/90"
              >
                <span>&gt;&gt; EMPEZAR CHALLENGE &lt;&lt;</span>
                <DeadlineCountdown />
              </a>
            ))}
          <Link
            href="/25/arcade/games"
            className="flex h-[60px] items-center justify-center rounded border-2 border-primary bg-black/30 px-6 font-bold text-primary text-sm uppercase tracking-wider shadow-[0_0_15px_rgba(255,214,0,0.2)] transition-colors hover:bg-primary/10"
          >
            &gt;&gt; VER JUEGOS &lt;&lt;
          </Link>
        </div>
      </div>
    </div>
  );
}
